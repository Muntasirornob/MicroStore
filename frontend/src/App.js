import React, { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Product image mapping (since we store image identifiers in DB)
const PRODUCT_IMAGES = {
  laptop: '/images/laptop.svg',
  smartphone: '/images/smartphone.svg',
  headphones: '/images/headphones.svg',
  smartwatch: '/images/smartwatch.svg',
  tablet: '/images/tablet.svg',
  camera: '/images/camera.svg',
};

// Fallback SVG icon component
const ProductIcon = ({ type }) => {
  const icons = {
    laptop: (
      <svg viewBox="0 0 24 24" width="80" height="80" fill="#3498db">
        <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
      </svg>
    ),
    smartphone: (
      <svg viewBox="0 0 24 24" width="80" height="80" fill="#9b59b6">
        <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"/>
      </svg>
    ),
    headphones: (
      <svg viewBox="0 0 24 24" width="80" height="80" fill="#e74c3c">
        <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
      </svg>
    ),
    smartwatch: (
      <svg viewBox="0 0 24 24" width="80" height="80" fill="#f39c12">
        <path d="M20 12c0-2.54-1.19-4.81-3.04-6.27L16 0H8l-.95 5.73C5.19 7.19 4 9.45 4 12s1.19 4.81 3.05 6.27L8 24h8l.96-5.73C18.81 16.81 20 14.54 20 12zM6 12c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6-6-2.69-6-6z"/>
      </svg>
    ),
    tablet: (
      <svg viewBox="0 0 24 24" width="80" height="80" fill="#1abc9c">
        <path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 14H5V6h14v12z"/>
      </svg>
    ),
    camera: (
      <svg viewBox="0 0 24 24" width="80" height="80" fill="#34495e">
        <circle cx="12" cy="12" r="3.2"/>
        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
      </svg>
    ),
  };
  return icons[type] || icons.laptop;
};

const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#2c3e50',
    color: 'white',
    borderRadius: '10px',
    marginBottom: '30px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  loginForm: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    padding: '8px 12px',
    borderRadius: '5px',
    border: 'none',
    fontSize: '14px',
  },
  button: {
    padding: '8px 16px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#3498db',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  buttonDisabled: {
    padding: '8px 16px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#95a5a6',
    color: 'white',
    cursor: 'not-allowed',
    fontSize: '14px',
    fontWeight: '500',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  },
  productImage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100px',
    marginBottom: '15px',
  },
  productName: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '5px',
    color: '#2c3e50',
  },
  productDescription: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginBottom: '10px',
  },
  productPrice: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: '5px',
  },
  productStock: {
    fontSize: '12px',
    color: '#95a5a6',
    marginBottom: '15px',
  },
  cart: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  cartTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#2c3e50',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
  },
  total: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '15px',
    textAlign: 'right',
  },
  checkoutBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '15px',
  },
  checkoutBtnDisabled: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    marginTop: '15px',
  },
  orders: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  orderItem: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    marginBottom: '10px',
  },
  status: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#27ae60',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    textTransform: 'capitalize',
  },
  message: {
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
  },
  spinner: {
    display: 'inline-block',
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  removeBtn: {
    marginLeft: '10px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    color: '#e74c3c',
    fontSize: '14px',
  },
};

// Add spinner animation
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
document.head.appendChild(spinnerStyle);

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('john@example.com');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState({ products: true, login: false, checkout: false, orders: false });

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      showMessage('Failed to fetch products. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, [showMessage]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const res = await fetch(`${API_URL}/api/orders?userId=${user.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  const login = async () => {
    if (!email.trim()) {
      showMessage('Please enter an email address', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, login: true }));
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        showMessage(data.error || 'Login failed', 'error');
        return;
      }

      setUser(data);
      showMessage(`Welcome, ${data.name}!`, 'success');
    } catch (err) {
      console.error('Login error:', err);
      showMessage('Login failed. Please check if services are running.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setOrders([]);
    showMessage('Logged out successfully', 'success');
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showMessage('Product is out of stock', 'error');
      return;
    }

    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        showMessage('Cannot add more - insufficient stock', 'error');
        return;
      }
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    showMessage(`${product.name} added to cart!`, 'success');
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
    } else if (newQty <= item.stock) {
      setCart(cart.map(i => i.id === productId ? { ...i, qty: newQty } : i));
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);
  };

  const checkout = async () => {
    if (!user) {
      showMessage('Please login to checkout', 'error');
      return;
    }

    if (cart.length === 0) {
      showMessage('Your cart is empty', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, checkout: true }));
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          products: cart.map((item) => ({ id: item.id, name: item.name, qty: item.qty })),
          total: parseFloat(getTotal()),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Checkout failed');
      }

      const order = await res.json();
      setOrders(prev => [order, ...prev]);
      setCart([]);
      showMessage(`Order #${order.id} placed successfully!`, 'success');
    } catch (err) {
      console.error('Checkout error:', err);
      showMessage(err.message || 'Checkout failed. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, checkout: false }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') login();
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.logo}>MicroStore</div>
        <div style={styles.userInfo}>
          {user ? (
            <>
              <span>Hello, {user.name}</span>
              <button style={styles.button} onClick={logout}>Logout</button>
            </>
          ) : (
            <div style={styles.loginForm}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                style={styles.input}
                disabled={loading.login}
              />
              <button
                style={loading.login ? styles.buttonDisabled : styles.button}
                onClick={login}
                disabled={loading.login}
              >
                {loading.login ? 'Logging in...' : 'Login'}
              </button>
            </div>
          )}
        </div>
      </header>

      {message && (
        <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
          {message.text}
        </div>
      )}

      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>Products</h2>

      {loading.products ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={styles.loading}>
          <p>No products available. Please check if the product service is running.</p>
          <button style={styles.button} onClick={fetchProducts}>Retry</button>
        </div>
      ) : (
        <div style={styles.productGrid}>
          {products.map((product) => (
            <div key={product.id} style={styles.productCard}>
              <div style={styles.productImage}>
                <ProductIcon type={product.image} />
              </div>
              <div style={styles.productName}>{product.name}</div>
              {product.description && (
                <div style={styles.productDescription}>{product.description}</div>
              )}
              <div style={styles.productPrice}>${product.price.toFixed(2)}</div>
              <div style={styles.productStock}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
              <button
                style={product.stock > 0 ? { ...styles.button, width: '100%' } : { ...styles.buttonDisabled, width: '100%' }}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
              >
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div style={styles.cart}>
          <div style={styles.cartTitle}>Shopping Cart ({cart.reduce((sum, item) => sum + item.qty, 0)} items)</div>
          {cart.map((item) => (
            <div key={item.id} style={styles.cartItem}>
              <span>{item.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  style={{ ...styles.button, padding: '4px 10px' }}
                >
                  -
                </button>
                <span>{item.qty}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  style={{ ...styles.button, padding: '4px 10px' }}
                  disabled={item.qty >= item.stock}
                >
                  +
                </button>
                <span style={{ minWidth: '80px', textAlign: 'right' }}>
                  ${(item.price * item.qty).toFixed(2)}
                </span>
                <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div style={styles.total}>Total: ${getTotal()}</div>
          <button
            style={loading.checkout ? styles.checkoutBtnDisabled : styles.checkoutBtn}
            onClick={checkout}
            disabled={loading.checkout}
          >
            {loading.checkout ? 'Processing...' : (user ? 'Checkout' : 'Login to Checkout')}
          </button>
        </div>
      )}

      {user && (
        <div style={styles.orders}>
          <div style={styles.cartTitle}>Your Orders</div>
          {loading.orders ? (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <p style={{ color: '#7f8c8d', textAlign: 'center' }}>No orders yet</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} style={styles.orderItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>Order #{order.id}</strong>
                  <span style={styles.status}>{order.status}</span>
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  {order.products.map((p) => `${p.name} x${p.qty}`).join(', ')}
                </div>
                <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
                  Total: ${parseFloat(order.total).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
