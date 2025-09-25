require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Database setup
let db;

function connectDatabase() {
  try {
    db = new sqlite3.Database('./fertilizer_shop.db');
    console.log('Connected to SQLite database.');
    initializeDatabase();
  } catch (err) {
    console.error('Error connecting to SQLite database:', err.message);
    process.exit(1);
  }
}

// Initialize database tables
function initializeDatabase() {
  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    supplier TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sales table
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_phone TEXT,
    total_amount REAL NOT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sale items table
  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'processing',
    shipping_address TEXT,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  // Cart items table
  db.run(`CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`, () => {
    console.log('Database tables initialized.');
    seedDemoData();
  });
}

// Seed demo data if tables are empty
function seedDemoData() {
  // Check products count
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (err) return console.error('Error checking products:', err);
    if (row.count === 0) {
      const demoProducts = [
        { name: 'NPK 20-20-20', type: 'NPK', price: 1200, quantity: 50, supplier: 'AgroChem', description: 'Balanced fertilizer for all crops' },
        { name: 'Urea', type: 'Urea', price: 900, quantity: 30, supplier: 'GreenGrow', description: 'High nitrogen content' },
        { name: 'Organic Compost', type: 'Organic', price: 700, quantity: 20, supplier: 'EcoFarms', description: 'Natural soil conditioner' }
      ];

      const stmt = db.prepare('INSERT INTO products (name, type, price, quantity, supplier, description) VALUES (?, ?, ?, ?, ?, ?)');
      demoProducts.forEach(product => {
        stmt.run([product.name, product.type, product.price, product.quantity, product.supplier, product.description]);
      });
      stmt.finalize();
      console.log('Seeded demo products');
    }

    // Check sales count
    db.get('SELECT COUNT(*) as count FROM sales', (err, row) => {
      if (err) return console.error('Error checking sales:', err);
      if (row.count === 0) {
        // Insert first sale
        db.run(
          'INSERT INTO sales (customer_name, customer_phone, total_amount) VALUES (?, ?, ?)',
          ['Ravi Kumar', '9876543210', 2400],
          function(err) {
            if (err) return console.error('Error inserting sale:', err);
            const saleId1 = this.lastID;

            // Get NPK product
            db.get('SELECT id, price FROM products WHERE name = ? LIMIT 1', ['NPK 20-20-20'], (err, prod) => {
              if (err) return console.error('Error getting NPK:', err);
              if (prod) {
                const qty = 2;
                db.run(
                  'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)',
                  [saleId1, prod.id, qty, prod.price, prod.price * qty]
                );
                db.run('UPDATE products SET quantity = quantity - ? WHERE id = ?', [qty, prod.id]);
              }
            });
          }
        );

        // Insert second sale
        db.run(
          'INSERT INTO sales (customer_name, customer_phone, total_amount) VALUES (?, ?, ?)',
          ['Sita Devi', '9123456780', 900],
          function(err) {
            if (err) return console.error('Error inserting sale:', err);
            const saleId2 = this.lastID;

            // Get Urea product
            db.get('SELECT id, price FROM products WHERE name = ? LIMIT 1', ['Urea'], (err, prod) => {
              if (err) return console.error('Error getting Urea:', err);
              if (prod) {
                const qty = 1;
                db.run(
                  'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)',
                  [saleId2, prod.id, qty, prod.price, prod.price * qty]
                );
                db.run('UPDATE products SET quantity = quantity - ? WHERE id = ?', [qty, prod.id]);
              }
            });
          }
        );

        console.log('Seeded demo sales');
      }

      // Seed users
      const bcrypt = require('bcryptjs');

      // Check owner user
      db.get('SELECT id FROM users WHERE email = ?', ['owner@example.com'], async (err, row) => {
        if (err) return console.error('Error checking owner:', err);
        if (!row) {
          const hashedPassword = await bcrypt.hash('owner123', 10);
          db.run(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            ['owner', 'owner@example.com', hashedPassword, 'owner']
          );
          console.log('Seeded owner user: email=owner@example.com, password=owner123');
        }

        // Check admin user
        db.get('SELECT id FROM users WHERE email = ?', ['admin@example.com'], async (err, row) => {
          if (err) return console.error('Error checking admin:', err);
          if (!row) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            db.run(
              'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
              ['admin', 'admin@example.com', hashedPassword, 'admin']
            );
            console.log('Seeded admin user: email=admin@example.com, password=admin123');
          }
        });
      });
    });
  });
}

// Routes

// Register user
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'user'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }

        const token = jwt.sign({ id: this.lastID, username, email, role: role || 'user' }, 'your-secret-key', { expiresIn: '24h' });
        res.json({ token, user: { id: this.lastID, username, email, role: role || 'user' } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error hashing password' });
  }
});

// Login user
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT id, username, email, password, role FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, 'your-secret-key', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  });
});

// Get all products
app.get('/api/products', verifyToken, (req, res) => {
  db.all('SELECT * FROM products ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single product
app.get('/api/products/:id', verifyToken, (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(row);
  });
});

// Add new product
app.post('/api/products', verifyToken, (req, res) => {
  const { name, type, price, quantity, supplier, description } = req.body;

  if (!name || !type || !price) {
    return res.status(400).json({ error: 'Name, type, and price are required' });
  }

  db.run(
    'INSERT INTO products (name, type, price, quantity, supplier, description) VALUES (?, ?, ?, ?, ?, ?)',
    [name, type, price, quantity || 0, supplier, description],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Product added successfully' });
    }
  );
});

// Update product
app.put('/api/products/:id', verifyToken, (req, res) => {
  const { name, type, price, quantity, supplier, description } = req.body;

  db.run(
    'UPDATE products SET name = ?, type = ?, price = ?, quantity = ?, supplier = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, type, price, quantity, supplier, description, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete product
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sales
app.get('/api/sales', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT s.*,
             GROUP_CONCAT(p.name || ' (x' || si.quantity || ')') as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      GROUP BY s.id
      ORDER BY s.sale_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single sale with items
app.get('/api/sales/:id', verifyToken, async (req, res) => {
  try {
    const [saleRows] = await db.execute('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    const sale = saleRows[0];
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const [items] = await db.execute(`
      SELECT si.*, p.name, p.type
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [req.params.id]);
    res.json({ ...sale, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new sale
app.post('/api/sales', verifyToken, async (req, res) => {
  const { customer_name, customer_phone, items, total_amount } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Sale must have at least one item' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert sale
    const [saleResult] = await connection.execute(
      'INSERT INTO sales (customer_name, customer_phone, total_amount) VALUES (?, ?, ?)',
      [customer_name, customer_phone, total_amount]
    );
    const saleId = saleResult.insertId;

    // Insert sale items and update product quantities
    for (const item of items) {
      await connection.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)',
        [saleId, item.product_id, item.quantity, item.price_per_unit, item.total_price]
      );
      await connection.execute(
        'UPDATE products SET quantity = quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();
    res.json({ id: saleId, message: 'Sale recorded successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Get inventory report
app.get('/api/reports/inventory', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id, name, type, price, quantity, supplier,
        CASE
          WHEN quantity <= 5 THEN 'Low Stock'
          WHEN quantity <= 10 THEN 'Medium Stock'
          ELSE 'Good Stock'
        END as stock_status
      FROM products
      ORDER BY quantity ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sales report
app.get('/api/reports/sales', async (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `
    SELECT
      DATE(sale_date) as date,
      COUNT(*) as total_sales,
      SUM(total_amount) as total_revenue
    FROM sales
  `;

  const params = [];
  if (start_date && end_date) {
    query += ' WHERE DATE(sale_date) BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  query += ' GROUP BY DATE(sale_date) ORDER BY date DESC';

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order
app.post('/api/orders', verifyToken, async (req, res) => {
  const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must have at least one item' });
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert order
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)',
      [userId, orderNumber, totalAmount, shippingAddress, paymentMethod]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      await connection.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.id, item.name, item.quantity, item.price, item.price * item.quantity]
      );
    }

    // Update product quantities
    for (const item of items) {
      await connection.execute(
        'UPDATE products SET quantity = quantity - ? WHERE id = ?',
        [item.quantity, item.id]
      );
    }

    await connection.commit();
    res.json({
      id: orderId,
      orderNumber,
      message: 'Order placed successfully'
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Get user orders
app.get('/api/orders', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.execute(`
      SELECT
        o.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', oi.product_id,
            'name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price_per_unit,
            'totalPrice', oi.total_price
          )
        ) as items_json
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId]);

    // Parse the JSON items
    const orders = rows.map(row => ({
      ...row,
      items: row.items_json ? JSON.parse(`[${row.items_json}]`) : []
    }));

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order
app.get('/api/orders/:id', verifyToken, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  try {
    const [orderRows] = await db.execute('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's cart
app.get('/api/cart', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.execute(`
      SELECT ci.*, p.name, p.price, p.quantity as available_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.added_at DESC
    `, [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to cart
app.post('/api/cart', verifyToken, async (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.user.id;

  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Product ID and valid quantity are required' });
  }

  try {
    // Check if product exists and has enough quantity
    const [productRows] = await db.execute('SELECT quantity FROM products WHERE id = ?', [product_id]);
    const product = productRows[0];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient product quantity' });
    }

    // Check if item already in cart
    const [existingRows] = await db.execute('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, product_id]);
    const existing = existingRows[0];

    if (existing) {
      // Update quantity
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > product.quantity) {
        return res.status(400).json({ error: 'Total quantity exceeds available stock' });
      }
      await db.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, existing.id]);
      res.json({ message: 'Cart item updated successfully' });
    } else {
      // Add new item
      const [result] = await db.execute('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, product_id, quantity]);
      res.json({ id: result.insertId, message: 'Item added to cart successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update cart item quantity
app.put('/api/cart/:productId', verifyToken, async (req, res) => {
  const { quantity } = req.body;
  const productId = req.params.productId;
  const userId = req.user.id;

  if (!quantity || quantity < 0) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }

  try {
    if (quantity === 0) {
      // Remove item if quantity is 0
      const [deleteResult] = await db.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      return res.json({ message: 'Item removed from cart successfully' });
    }

    // Check available quantity
    const [productRows] = await db.execute('SELECT quantity FROM products WHERE id = ?', [productId]);
    const product = productRows[0];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient product quantity' });
    }

    const [updateResult] = await db.execute('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, userId, productId]);
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    res.json({ message: 'Cart item updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove item from cart
app.delete('/api/cart/:productId', verifyToken, async (req, res) => {
  const productId = req.params.productId;
  const userId = req.user.id;

  try {
    const [result] = await db.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    res.json({ message: 'Item removed from cart successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear user's cart
app.delete('/api/cart', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    res.json({ message: 'Cart cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectDatabase();
});