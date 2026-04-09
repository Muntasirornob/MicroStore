const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');

const app = express();

// Configuration
const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:5002';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:5003';

// Middleware - Note: DO NOT use express.json() before proxy routes
app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));
app.use(cors({ origin: ALLOWED_ORIGINS }));

// Request ID middleware for tracing
app.use((req, res, next) => {
    req.requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
    next();
});

// Proxy configuration with error handling
const createServiceProxy = (target, pathRewrite) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite,
        timeout: 30000,
        proxyTimeout: 30000,
        onError: (err, req, res) => {
            console.error(`[${req.requestId}] Proxy error to ${target}:`, err.message);
            if (!res.headersSent) {
                res.status(503).json({
                    error: 'Service temporarily unavailable',
                    service: target,
                    requestId: req.requestId
                });
            }
        },
        onProxyReq: (proxyReq, req) => {
            proxyReq.setHeader('X-Request-ID', req.requestId);
            console.log(`[${req.requestId}] Proxying ${req.method} ${req.path} -> ${target}`);
        },
        onProxyRes: (proxyRes, req) => {
            console.log(`[${req.requestId}] Response: ${proxyRes.statusCode}`);
        }
    });
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString()
    });
});

// Aggregated health check - checks all services
app.get('/api/health/all', async (req, res) => {
    const checkService = async (name, url) => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${url}/health`, { signal: controller.signal });
            clearTimeout(timeout);

            if (response.ok) {
                return { name, status: 'healthy', url };
            }
            return { name, status: 'unhealthy', url, error: `HTTP ${response.status}` };
        } catch (error) {
            return { name, status: 'unhealthy', url, error: error.message };
        }
    };

    const results = await Promise.all([
        checkService('product-service', PRODUCT_SERVICE),
        checkService('order-service', ORDER_SERVICE),
        checkService('user-service', USER_SERVICE)
    ]);

    const allHealthy = results.every(r => r.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
        gateway: 'healthy',
        services: results,
        timestamp: new Date().toISOString()
    });
});

// Proxy routes - these MUST come before any body-parsing middleware
app.use('/api/products', createServiceProxy(PRODUCT_SERVICE, { '^/api/products': '/products' }));
app.use('/api/orders', createServiceProxy(ORDER_SERVICE, { '^/api/orders': '/orders' }));
app.use('/api/users', createServiceProxy(USER_SERVICE, { '^/api/users': '/users' }));
app.use('/api/login', createServiceProxy(USER_SERVICE, { '^/api/login': '/login' }));

// 404 handler
app.use((req, res) => {
    console.warn(`[${req.requestId}] 404: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[${req.requestId}] Error:`, err.message);
    res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Service endpoints:');
    console.log(`  Products: ${PRODUCT_SERVICE}`);
    console.log(`  Orders:   ${ORDER_SERVICE}`);
    console.log(`  Users:    ${USER_SERVICE}`);
});
