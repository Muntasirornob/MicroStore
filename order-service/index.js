const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const morgan = require('morgan');

const app = express();

// Configuration from environment
const PORT = process.env.PORT || 5002;
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:ontu123@localhost:5432/orderdb';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

// Middleware
app.use(morgan('combined'));
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// Database connection
const sequelize = new Sequelize(DATABASE_URL, {
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Order Model
const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },
    products: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'confirmed'
    }
}, {
    tableName: 'orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Request validation middleware
const validateOrder = (req, res, next) => {
    const { userId, products, total } = req.body;

    if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ error: 'Valid userId is required' });
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: 'Products array is required and cannot be empty' });
    }
    if (!total || typeof total !== 'number' || total <= 0) {
        return res.status(400).json({ error: 'Valid total amount is required' });
    }

    next();
};

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Routes
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({
            status: 'healthy',
            service: 'order-service',
            database: 'connected'
        });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(503).json({
            status: 'unhealthy',
            service: 'order-service',
            database: 'disconnected'
        });
    }
});

app.get('/orders', asyncHandler(async (req, res) => {
    const { userId } = req.query;

    const where = userId ? { userId: parseInt(userId) } : {};
    const orders = await Order.findAll({
        where,
        order: [['created_at', 'DESC']]
    });

    console.log(`Retrieved ${orders.length} orders`);
    res.json(orders);
}));

app.get('/orders/:id', asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
        console.warn(`Order ${req.params.id} not found`);
        return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`Retrieved order ${req.params.id}`);
    res.json(order);
}));

app.post('/orders', validateOrder, asyncHandler(async (req, res) => {
    const { userId, products, total } = req.body;

    const order = await Order.create({
        userId,
        products,
        total
    });

    console.log(`Created order ${order.id} for user ${userId}`);
    res.status(201).json(order);
}));

app.patch('/orders/:id/status', asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    await order.save();

    console.log(`Updated order ${req.params.id} status to ${status}`);
    res.json(order);
}));

app.delete('/orders/:id', asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    await order.destroy();
    console.log(`Deleted order ${req.params.id}`);
    res.status(204).send();
}));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Database initialization and server start
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established');

        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('Database synchronized');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Order service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
