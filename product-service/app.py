import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration from environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql+psycopg://postgres:ontu123@localhost:5432/productdb'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CORS configuration - restrict in production
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, origins=allowed_origins)

db = SQLAlchemy(app)


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    image = db.Column(db.String(10), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    stock = db.Column(db.Integer, default=100)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': float(self.price),
            'image': self.image,
            'description': self.description,
            'stock': self.stock
        }


def seed_products():
    """Seed initial products if table is empty"""
    if Product.query.count() == 0:
        initial_products = [
            Product(name='Laptop', price=999.99, image='laptop', description='High-performance laptop', stock=50),
            Product(name='Smartphone', price=699.99, image='smartphone', description='Latest smartphone', stock=100),
            Product(name='Headphones', price=199.99, image='headphones', description='Wireless headphones', stock=200),
            Product(name='Smartwatch', price=299.99, image='smartwatch', description='Fitness smartwatch', stock=75),
            Product(name='Tablet', price=449.99, image='tablet', description='10-inch tablet', stock=60),
            Product(name='Camera', price=549.99, image='camera', description='Digital camera', stock=40),
        ]
        db.session.bulk_save_objects(initial_products)
        db.session.commit()
        logger.info('Database seeded with initial products')


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint with DB connectivity verification"""
    try:
        db.session.execute(db.text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'service': 'product-service',
            'database': 'connected'
        })
    except SQLAlchemyError as e:
        logger.error(f'Database health check failed: {e}')
        return jsonify({
            'status': 'unhealthy',
            'service': 'product-service',
            'database': 'disconnected'
        }), 503


@app.route('/products', methods=['GET'])
def get_products():
    """Get all products with optional filtering"""
    try:
        products = Product.query.all()
        logger.info(f'Retrieved {len(products)} products')
        return jsonify([p.to_dict() for p in products])
    except SQLAlchemyError as e:
        logger.error(f'Error fetching products: {e}')
        return jsonify({'error': 'Failed to fetch products'}), 500


@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by ID"""
    try:
        product = Product.query.get(product_id)
        if product:
            logger.info(f'Retrieved product {product_id}')
            return jsonify(product.to_dict())
        logger.warning(f'Product {product_id} not found')
        return jsonify({'error': 'Product not found'}), 404
    except SQLAlchemyError as e:
        logger.error(f'Error fetching product {product_id}: {e}')
        return jsonify({'error': 'Failed to fetch product'}), 500


@app.route('/products', methods=['POST'])
def create_product():
    """Create a new product"""
    try:
        data = request.get_json()

        if not data or not all(k in data for k in ['name', 'price', 'image']):
            return jsonify({'error': 'Missing required fields: name, price, image'}), 400

        product = Product(
            name=data['name'],
            price=data['price'],
            image=data['image'],
            description=data.get('description', ''),
            stock=data.get('stock', 100)
        )
        db.session.add(product)
        db.session.commit()

        logger.info(f'Created product: {product.name}')
        return jsonify(product.to_dict()), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f'Error creating product: {e}')
        return jsonify({'error': 'Failed to create product'}), 500


@app.route('/products/<int:product_id>/stock', methods=['PATCH'])
def update_stock(product_id):
    """Update product stock (for order processing)"""
    try:
        data = request.get_json()
        quantity = data.get('quantity', 0)

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        if product.stock + quantity < 0:
            return jsonify({'error': 'Insufficient stock'}), 400

        product.stock += quantity
        db.session.commit()

        logger.info(f'Updated stock for product {product_id}: {product.stock}')
        return jsonify(product.to_dict())
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f'Error updating stock: {e}')
        return jsonify({'error': 'Failed to update stock'}), 500


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_products()

    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_ENV') == 'development'
    logger.info(f'Starting product service on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug)
