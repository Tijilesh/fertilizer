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
const db = new sqlite3.Database('./fertilizer_shop.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

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

  console.log('Database tables initialized.');
  seedDemoData();
}

// Seed demo data if tables are empty
function seedDemoData() {
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (err) {
      console.error('Error checking products count:', err.message)
      return
    }
    if (row && row.count === 0) {
      const demoProducts = [
        { name: 'NPK 20-20-20', type: 'NPK', price: 1200, quantity: 50, supplier: 'AgroChem', description: 'Balanced fertilizer for all crops' },
        { name: 'Urea', type: 'Urea', price: 900, quantity: 30, supplier: 'GreenGrow', description: 'High nitrogen content' },
        { name: 'Organic Compost', type: 'Organic', price: 700, quantity: 20, supplier: 'EcoFarms', description: 'Natural soil conditioner' }
      ]
      const stmt = db.prepare('INSERT INTO products (name, type, price, quantity, supplier, description) VALUES (?, ?, ?, ?, ?, ?)')
      demoProducts.forEach(p => stmt.run([p.name, p.type, p.price, p.quantity, p.supplier, p.description]))
      stmt.finalize(() => console.log('Seeded demo products'))
    }
  })

  db.get('SELECT COUNT(*) as count FROM sales', (err, row) => {
    if (err) {
      console.error('Error checking sales count:', err.message)
      return
    }
    if (row && row.count === 0) {
      db.serialize(() => {
        db.run('INSERT INTO sales (customer_name, customer_phone, total_amount) VALUES (?, ?, ?)', ['Ravi Kumar', '9876543210', 2400], function(err) {
          if (!err) {
            const saleId = this.lastID
            // Find product ids
            db.get('SELECT id, price FROM products WHERE name = ? LIMIT 1', ['NPK 20-20-20'], (e, prod) => {
              if (!e && prod) {
                const qty = 2
                db.run('INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)', [saleId, prod.id, qty, prod.price, prod.price * qty])
                db.run('UPDATE products SET quantity = quantity - ? WHERE id = ?', [qty, prod.id])
              }
            })
          }
        })

        db.run('INSERT INTO sales (customer_name, customer_phone, total_amount) VALUES (?, ?, ?)', ['Sita Devi', '9123456780', 900], function(err) {
          if (!err) {
            const saleId = this.lastID
            db.get('SELECT id, price FROM products WHERE name = ? LIMIT 1', ['Urea'], (e, prod) => {
              if (!e && prod) {
                const qty = 1
                db.run('INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)', [saleId, prod.id, qty, prod.price, prod.price * qty])
                db.run('UPDATE products SET quantity = quantity - ? WHERE id = ?', [qty, prod.id])
              }
            })
          }
        })
      })
      console.log('Seeded demo sales')
    }
  })

  // Seed owner and admin users
  const bcrypt = require('bcryptjs');

  // Seed owner user
  db.get('SELECT id FROM users WHERE email = ?', ['owner@example.com'], (err, row) => {
    if (err) {
      console.error('Error checking owner user:', err.message)
      return
    }
    if (!row) {
      bcrypt.hash('owner123', 10).then(hashedPassword => {
        db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', ['owner', 'owner@example.com', hashedPassword, 'owner'], function(err) {
          if (!err) {
            console.log('Seeded owner user: email=owner@example.com, password=owner123')
          }
        })
      })
    }
  })

  // Seed admin user
  db.get('SELECT id FROM users WHERE email = ?', ['admin@example.com'], (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err.message)
      return
    }
    if (!row) {
      bcrypt.hash('admin123', 10).then(hashedPassword => {
        db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', ['admin', 'admin@example.com', hashedPassword, 'admin'], function(err) {
          if (!err) {
            console.log('Seeded admin user: email=admin@example.com, password=admin123')
          }
        })
      })
    }
  })
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
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

// Add new product
app.post('/api/products', verifyToken, (req, res) => {
  const { name, type, price, quantity, supplier, description } = req.body;

  if (!name || !type || !price) {
    res.status(400).json({ error: 'Name, type, and price are required' });
    return;
  }

  db.run(
    'INSERT INTO products (name, type, price, quantity, supplier, description) VALUES (?, ?, ?, ?, ?, ?)',
    [name, type, price, quantity || 0, supplier, description],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
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
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete product
app.delete('/api/products/:id', verifyToken, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Get all sales
app.get('/api/sales', verifyToken, (req, res) => {
  db.all(`
    SELECT s.*,
           GROUP_CONCAT(p.name || ' (x' || si.quantity || ')') as items
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN products p ON si.product_id = p.id
    GROUP BY s.id
    ORDER BY s.sale_date DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single sale with items
app.get('/api/sales/:id', verifyToken, (req, res) => {
  db.get('SELECT * FROM sales WHERE id = ?', [req.params.id], (err, sale) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    db.all(`
      SELECT si.*, p.name, p.type
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [req.params.id], (err, items) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ ...sale, items });
    });
  });
});

// Create new sale
app.post('/api/sales', verifyToken, (req, res) => {
  const { customer_name, customer_phone, items, total_amount } = req.body;

  if (!items || items.length === 0) {
    res.status(400).json({ error: 'Sale must have at least one item' });
    return;
  }

  db.serialize(() => {
    // Insert sale
    db.run(
      'INSERT INTO sales (customer_name, customer_phone, total_amount) VALUES (?, ?, ?)',
      [customer_name, customer_phone, total_amount],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const saleId = this.lastID;

        // Insert sale items and update product quantities
        const stmt = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)');
        const updateStmt = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');

        items.forEach(item => {
          stmt.run([saleId, item.product_id, item.quantity, item.price_per_unit, item.total_price]);
          updateStmt.run([item.quantity, item.product_id]);
        });

        stmt.finalize();
        updateStmt.finalize();

        res.json({ id: saleId, message: 'Sale recorded successfully' });
      }
    );
  });
});

// Get inventory report
app.get('/api/reports/inventory', (req, res) => {
  db.all(`
    SELECT 
      id, name, type, price, quantity, supplier,
      CASE 
        WHEN quantity <= 5 THEN 'Low Stock'
        WHEN quantity <= 10 THEN 'Medium Stock'
        ELSE 'Good Stock'
      END as stock_status
    FROM products 
    ORDER BY quantity ASC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get sales report
app.get('/api/reports/sales', (req, res) => {
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

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create order
app.post('/api/orders', verifyToken, (req, res) => {
  const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must have at least one item' });
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  db.serialize(() => {
    // Insert order
    db.run(
      'INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)',
      [userId, orderNumber, totalAmount, shippingAddress, paymentMethod],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const orderId = this.lastID;

        // Insert order items
        const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?, ?)');

        items.forEach(item => {
          stmt.run([orderId, item.id, item.name, item.quantity, item.price, item.price * item.quantity]);
        });

        stmt.finalize();

        // Update product quantities
        const updateStmt = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
        items.forEach(item => {
          updateStmt.run([item.quantity, item.id]);
        });

        updateStmt.finalize(() => {
          res.json({
            id: orderId,
            orderNumber,
            message: 'Order placed successfully'
          });
        });
      }
    );
  });
});

// Get user orders
app.get('/api/orders', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.all(`
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
  `, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Parse the JSON items
    const orders = rows.map(row => ({
      ...row,
      items: row.items_json ? JSON.parse(`[${row.items_json}]`) : []
    }));

    res.json(orders);
  });
});

// Get single order
app.get('/api/orders/:id', verifyToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, order) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId], (err, items) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ ...order, items });
    });
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 