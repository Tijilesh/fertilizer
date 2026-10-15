require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

// Email transporter — uses port 587 (STARTTLS) to avoid firewall blocks on 465
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Database pool
let db;

async function columnExists(tableName, columnName) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, tableName, columnName]
  );
  return rows[0].count > 0;
}

async function hasForeignKey(tableName, columnName, referencedTable) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
       AND REFERENCED_TABLE_NAME = ?`,
    [process.env.DB_NAME, tableName, columnName, referencedTable]
  );
  return rows[0].count > 0;
}

async function ensureSalesFarmerColumn() {
  if (!(await columnExists('sales', 'farmer_id'))) {
    await db.execute(`ALTER TABLE sales ADD COLUMN farmer_id INT NULL`);
  }
}

async function connectDatabase() {
  try {
    console.log('Attempting to connect to MySQL database at', process.env.DB_HOST);
    // First create the database if it doesn't exist
    const initConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    await initConn.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await initConn.end();

    db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      maxIdle: 10,
      idleTimeout: 60000
    });

    console.log('Connected to MySQL database.');
    await initializeDatabase();
    initAutoReminderScheduler();
  } catch (error) {
    console.error('CRITICAL: Failed to connect to MySQL database.');
    console.error('Error details:', error.message);
    console.error('Please ensure MySQL is running and credentials in server/.env are correct.');
    console.error('The server will continue to run but database-dependent features will fail.');
  }
}

// Initialize database tables
async function initializeDatabase() {
  await db.execute(`CREATE TABLE IF NOT EXISTS farmers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    location VARCHAR(255),
    farm_size DECIMAL(10,2),
    crop_type VARCHAR(255),
    credit_limit DECIMAL(10,2) DEFAULT 0,
    current_credit DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    supplier VARCHAR(255),
    description TEXT,
    batch_number VARCHAR(50),
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(100) DEFAULT 'Cash',
    status VARCHAR(50) DEFAULT 'completed',
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  if (!(await columnExists('users', 'iot_sensor_id'))) {
    await db.execute(`ALTER TABLE users ADD COLUMN iot_sensor_id VARCHAR(100) NULL`);
  }

  if (!(await columnExists('users', 'phone'))) {
    await db.execute(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL`);
  }

  if (!(await columnExists('users', 'farmer_id'))) {
    await db.execute(`ALTER TABLE users ADD COLUMN farmer_id INT NULL`);
  }

  if (!(await hasForeignKey('users', 'farmer_id', 'farmers'))) {
    try {
      await db.execute(`ALTER TABLE users ADD CONSTRAINT fk_users_farmer_id FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE SET NULL`);
    } catch (error) {
      if (!String(error.message).includes('Duplicate')) {
        throw error;
      }
    }
  }

  if (!(await columnExists('farmers', 'interest_rate'))) {
    await db.execute(`ALTER TABLE farmers ADD COLUMN interest_rate DECIMAL(5,2) DEFAULT 0`);
  }

  if (!(await columnExists('farmers', 'accrued_interest'))) {
    await db.execute(`ALTER TABLE farmers ADD COLUMN accrued_interest DECIMAL(12,2) DEFAULT 0`);
  }

  if (!(await columnExists('farmers', 'soil_type'))) {
    await db.execute(`ALTER TABLE farmers ADD COLUMN soil_type VARCHAR(100) NULL`);
  }

  if (!(await columnExists('sales', 'farmer_id'))) {
    await db.execute(`ALTER TABLE sales ADD COLUMN farmer_id INT NULL`);
  }

  if (!(await columnExists('sales', 'sale_type'))) {
    await db.execute(`ALTER TABLE sales ADD COLUMN sale_type VARCHAR(50) DEFAULT 'walk-in'`);
  }

  if (!(await hasForeignKey('sales', 'farmer_id', 'farmers'))) {
    try {
      await db.execute(`ALTER TABLE sales ADD CONSTRAINT fk_sales_farmer_id FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE SET NULL`);
    } catch (error) {
      // If a compatible FK already exists with a different generated name, continue.
      if (!String(error.message).includes('Duplicate')) {
        throw error;
      }
    }
  }

  await db.execute(`CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'processing',
    shipping_address TEXT,
    payment_method VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  if (!(await columnExists('orders', 'subtotal'))) {
    await db.execute(`ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0`);
  }
  if (!(await columnExists('orders', 'coupon_discount'))) {
    await db.execute(`ALTER TABLE orders ADD COLUMN coupon_discount DECIMAL(10,2) DEFAULT 0`);
  }
  if (!(await columnExists('orders', 'cgst_amount'))) {
    await db.execute(`ALTER TABLE orders ADD COLUMN cgst_amount DECIMAL(10,2) DEFAULT 0`);
  }
  if (!(await columnExists('orders', 'sgst_amount'))) {
    await db.execute(`ALTER TABLE orders ADD COLUMN sgst_amount DECIMAL(10,2) DEFAULT 0`);
  }
  if (!(await columnExists('orders', 'rounding_adjustment'))) {
    await db.execute(`ALTER TABLE orders ADD COLUMN rounding_adjustment DECIMAL(10,2) DEFAULT 0`);
  }
  if (!(await columnExists('orders', 'utr_number'))) {
    await db.execute(`ALTER TABLE orders ADD COLUMN utr_number VARCHAR(100)`);
  }

  await db.execute(`CREATE TABLE IF NOT EXISTS shop_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    purchase_order_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    payment_type ENUM('income', 'expense') NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (sale_id) REFERENCES sales (id),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS supplier_returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT DEFAULT 1,
    debit_note_no VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    product_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(100) NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Approved',
    settlement_type VARCHAR(50) DEFAULT 'Debit Note / Balance Deduction',
    notes TEXT,
    return_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS cash_drawer_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT DEFAULT 1,
    session_code VARCHAR(50) NOT NULL UNIQUE,
    session_date DATE NOT NULL,
    opened_by INT NULL,
    opened_by_name VARCHAR(255) DEFAULT 'Shop Manager',
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    opening_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
    closed_by INT NULL,
    closed_by_name VARCHAR(255) NULL,
    closed_at DATETIME NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    expected_cash DECIMAL(10,2) DEFAULT 0,
    actual_cash DECIMAL(10,2) DEFAULT 0,
    difference DECIMAL(10,2) DEFAULT 0,
    cash_sales_amount DECIMAL(10,2) DEFAULT 0,
    online_sales_amount DECIMAL(10,2) DEFAULT 0,
    credit_sales_amount DECIMAL(10,2) DEFAULT 0,
    total_sales_amount DECIMAL(10,2) DEFAULT 0,
    cash_in_manual DECIMAL(10,2) DEFAULT 0,
    cash_out_expenses DECIMAL(10,2) DEFAULT 0,
    denominations TEXT NULL,
    handover_to VARCHAR(255) NULL,
    closing_notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS cash_drawer_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    shop_id INT DEFAULT 1,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) DEFAULT 'Miscellaneous',
    description TEXT NULL,
    created_by_name VARCHAR(255) DEFAULT 'Staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES cash_drawer_sessions(id) ON DELETE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS farmer_interest_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    transaction_type ENUM('CREDIT_PURCHASE', 'ACCRUAL', 'PAYMENT', 'WAIVER') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    principal_amount DECIMAL(12,2) DEFAULT 0,
    interest_amount DECIMAL(12,2) DEFAULT 0,
    interest_rate DECIMAL(5,2),
    reference_id VARCHAR(100),
    calculation_period VARCHAR(50),
    reason TEXT,
    performed_by INT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    responses TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS product_compatibility (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product1_id INT NOT NULL,
    product2_id INT NOT NULL,
    compatibility_type ENUM('compatible','incompatible','caution') NOT NULL,
    reason TEXT,
    crop_specific TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product1_id) REFERENCES products (id),
    FOREIGN KEY (product2_id) REFERENCES products (id),
    UNIQUE KEY unique_pair (product1_id, product2_id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS crops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(100),
    season VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS product_crop_compatibility (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    crop_id INT NOT NULL,
    compatibility_notes TEXT,
    recommended_dosage VARCHAR(255),
    warnings TEXT,
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (crop_id) REFERENCES crops (id),
    UNIQUE KEY unique_product_crop (product_id, crop_id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS email_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS farmer_tips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    icon VARCHAR(10),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS seasonal_offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount VARCHAR(50),
    valid_until DATETIME,
    icon VARCHAR(10),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS credit_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATETIME NOT NULL,
    status ENUM('due', 'overdue') DEFAULT 'due',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS government_schemes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    description TEXT,
    eligibility TEXT,
    benefits TEXT,
    application TEXT,
    link VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // --- Multi-Tenant Support ---
  await db.execute(`CREATE TABLE IF NOT EXISTS shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.execute(`INSERT IGNORE INTO shops (id, name, slug) VALUES (1, 'Default Fertilizer Shop', 'default-shop')`);

  const tenantTables = [
    'farmers', 'products', 'sales', 'users', 'orders', 
    'suppliers', 'purchase_orders', 'payments', 'surveys', 
    'crops', 'farmer_tips', 'seasonal_offers', 'credit_reminders', 'government_schemes',
    'supplier_returns', 'cash_drawer_sessions', 'cash_drawer_transactions'
  ];
  for (const table of tenantTables) {
    if (!(await columnExists(table, 'shop_id'))) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN shop_id INT DEFAULT 1`);
      await db.execute(`UPDATE ${table} SET shop_id = 1 WHERE shop_id IS NULL`);
      try {
        await db.execute(`ALTER TABLE ${table} ADD CONSTRAINT fk_${table}_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE`);
      } catch (err) {}
    }
  }

  if (!(await columnExists('shop_settings', 'shop_id'))) {
    await db.execute(`ALTER TABLE shop_settings ADD COLUMN shop_id INT DEFAULT 1`);
    await db.execute(`UPDATE shop_settings SET shop_id = 1 WHERE shop_id IS NULL`);
    try {
      await db.execute(`ALTER TABLE shop_settings DROP PRIMARY KEY, ADD PRIMARY KEY (shop_id, setting_key)`);
    } catch (err) {}
    try {
      await db.execute(`ALTER TABLE shop_settings ADD CONSTRAINT fk_shop_settings_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE`);
    } catch(err) {}
  }
  // ----------------------------

  // Cleanup from older runs (before UNIQUE constraints existed)
  try {
    await db.execute(`
      DELETE p1
      FROM products p1
      JOIN products p2
        ON p1.name = p2.name
       AND p1.id > p2.id
    `);
  } catch (e) {
    console.error('Products dedupe error:', e.message);
  }

  // Ensure unique constraint on products is per-shop (shop_id, name)
  try {
    const [pIndexes] = await db.query('SHOW INDEX FROM products');
    if (pIndexes.some(i => i.Key_name === 'uniq_products_name')) {
      await db.query('ALTER TABLE products DROP INDEX uniq_products_name');
    }
    if (!pIndexes.some(i => i.Key_name === 'uniq_shop_product_name')) {
      await db.query('ALTER TABLE products ADD UNIQUE KEY uniq_shop_product_name (shop_id, name)');
    }
  } catch (e) {
    // ignore
  }

  // Ensure unique constraint on farmers is per-shop (shop_id, phone)
  try {
    const [fIndexes] = await db.query('SHOW INDEX FROM farmers');
    if (fIndexes.some(i => i.Key_name === 'phone')) {
      await db.query('ALTER TABLE farmers DROP INDEX phone');
    }
    if (!fIndexes.some(i => i.Key_name === 'uniq_shop_farmer_phone')) {
      await db.query('ALTER TABLE farmers ADD UNIQUE KEY uniq_shop_farmer_phone (shop_id, phone)');
    }
  } catch (e) {
    // ignore
  }

  // Ensure unique constraint on suppliers is per-shop (shop_id, name)
  try {
    const [sIndexes] = await db.query('SHOW INDEX FROM suppliers');
    if (sIndexes.some(i => i.Key_name === 'name')) {
      await db.query('ALTER TABLE suppliers DROP INDEX name');
    }
    if (!sIndexes.some(i => i.Key_name === 'uniq_shop_supplier_name')) {
      await db.query('ALTER TABLE suppliers ADD UNIQUE KEY uniq_shop_supplier_name (shop_id, name)');
    }
  } catch (e) {
    // ignore
  }

  // Backfill suppliers from products table for any shops that don't have them yet
  try {
    await db.execute(`
      INSERT IGNORE INTO suppliers (name, shop_id, status)
      SELECT DISTINCT TRIM(supplier), COALESCE(shop_id, 1), 'active'
      FROM products
      WHERE supplier IS NOT NULL AND TRIM(supplier) != ''
    `);
  } catch (e) {
    console.error('Suppliers backfill error:', e.message);
  }

  // Cleanup compatibility rules from older seeds (orphaned + duplicates)
  try {
    await db.execute(`
      DELETE pc
      FROM product_compatibility pc
      LEFT JOIN products p1 ON pc.product1_id = p1.id
      LEFT JOIN products p2 ON pc.product2_id = p2.id
      WHERE p1.id IS NULL OR p2.id IS NULL
    `);

    await db.execute(`
      UPDATE product_compatibility
      SET
        product1_id = LEAST(product1_id, product2_id),
        product2_id = GREATEST(product1_id, product2_id)
    `);

    await db.execute(`
      DELETE pc1
      FROM product_compatibility pc1
      JOIN product_compatibility pc2
        ON pc1.product1_id = pc2.product1_id
       AND pc1.product2_id = pc2.product2_id
       AND pc1.id > pc2.id
    `);
  } catch (e) {
    console.error('Compatibility cleanup error:', e.message);
  }

  // Ensure credit_reminders columns for automated monthly reminders
  try {
    if (!(await columnExists('credit_reminders', 'farmer_id'))) {
      await db.execute('ALTER TABLE credit_reminders ADD COLUMN farmer_id INT NULL');
    }
    if (!(await columnExists('credit_reminders', 'phone'))) {
      await db.execute('ALTER TABLE credit_reminders ADD COLUMN phone VARCHAR(20) NULL');
    }
    if (!(await columnExists('credit_reminders', 'principal_amount'))) {
      await db.execute('ALTER TABLE credit_reminders ADD COLUMN principal_amount DECIMAL(10,2) DEFAULT 0');
    }
    if (!(await columnExists('credit_reminders', 'interest_amount'))) {
      await db.execute('ALTER TABLE credit_reminders ADD COLUMN interest_amount DECIMAL(10,2) DEFAULT 0');
    }
    if (!(await columnExists('credit_reminders', 'month_period'))) {
      await db.execute('ALTER TABLE credit_reminders ADD COLUMN month_period VARCHAR(10) NULL');
    }
    if (!(await columnExists('credit_reminders', 'language'))) {
      await db.execute("ALTER TABLE credit_reminders ADD COLUMN language VARCHAR(10) DEFAULT 'te'");
    }
    if (!(await columnExists('credit_reminders', 'message_text'))) {
      await db.execute('ALTER TABLE credit_reminders ADD COLUMN message_text TEXT NULL');
    }
    if (!(await columnExists('credit_reminders', 'reminder_type'))) {
      await db.execute("ALTER TABLE credit_reminders ADD COLUMN reminder_type VARCHAR(50) DEFAULT 'automated_monthly'");
    }
    if (!(await columnExists('credit_reminders', 'sent_at'))) {
      await db.execute('ALTER TABLE credit_reminders ADD COLUMN sent_at DATETIME NULL');
    }
    await db.execute("ALTER TABLE credit_reminders MODIFY COLUMN status VARCHAR(50) DEFAULT 'due'");
  } catch (err) {
    console.error('credit_reminders migration error:', err.message);
  }

  console.log('Database tables initialized.');
  await seedDemoData();
}

// Seed demo data if tables are empty
async function seedDemoData() {
  const demoProducts = require('./products.json');

  // Idempotent seeding: keep stable product IDs and avoid growing related tables.
  // Requires `products.name` to be UNIQUE (created in schema).
  for (const product of demoProducts) {
    await db.execute(
      `INSERT INTO products (name, type, price, quantity, supplier, description, batch_number, expiry_date, shop_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         type = VALUES(type),
         price = VALUES(price),
         quantity = GREATEST(quantity, VALUES(quantity)),
         supplier = VALUES(supplier),
         description = VALUES(description),
         batch_number = COALESCE(batch_number, VALUES(batch_number)),
         expiry_date = COALESCE(expiry_date, VALUES(expiry_date))`,
      [product.name, product.type, product.price, product.quantity, product.supplier, product.description, product.batch_number, product.expiry_date]
    );
  }

  const [[{ count: productCount }]] = await db.execute('SELECT COUNT(*) as count FROM products');
  console.log(`Ensured demo products from JSON. Total products: ${productCount}`);

  // Seed suppliers from demo products
  const demoSuppliers = [...new Set(demoProducts.map(p => p.supplier).filter(Boolean))];
  for (const supName of demoSuppliers) {
    await db.execute(
      `INSERT IGNORE INTO suppliers (name, shop_id, status) VALUES (?, 1, 'active')`,
      [supName]
    );
  }

  // Demo sales seeding disabled so customer and sales lists remain clean and driven purely by user transactions

  // Seed owner and admin users
  const [[ownerRow]] = await db.execute('SELECT id FROM users WHERE email = ?', ['owner@example.com']);
  if (!ownerRow) {
    const hashedPassword = await bcrypt.hash('owner123', 10);
    await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', ['owner', 'owner@example.com', hashedPassword, 'owner']);
    console.log('Seeded owner user: email=owner@example.com, password=owner123');
  }

  const [[adminRow]] = await db.execute('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
  if (!adminRow) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', ['admin', 'admin@example.com', hashedPassword, 'admin']);
    console.log('Seeded admin user: email=admin@example.com, password=admin123');
  }

  const [[userRow]] = await db.execute('SELECT id FROM users WHERE email = ?', ['user@example.com']);
  if (!userRow) {
    const hashedPassword = await bcrypt.hash('user123', 10);
    await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', ['user', 'user@example.com', hashedPassword, 'user']);
    console.log('Seeded demo customer user: email=user@example.com, password=user123');
  }

  await seedCompatibilityData();
  await seedDashboardData();
  await seedGovernmentSchemes();
}

// Seed dashboard specific data
async function seedDashboardData() {
  const [[{ count: tipsCount }]] = await db.execute('SELECT COUNT(*) as count FROM farmer_tips');
  if (tipsCount === 0) {
    const demoTips = [
      ['Soil Testing Importance', 'Regular soil testing helps determine nutrient deficiencies and pH levels for optimal crop growth.', 'Soil Management', '🧪'],
      ['Water Conservation', 'Use drip irrigation to reduce water usage by up to 50% and improve crop yields.', 'Irrigation', '💧'],
      ['Pest Management', 'Integrated Pest Management combines biological, cultural, and chemical methods for sustainable pest control.', 'Pest Control', '🐛']
    ];
    for (const tip of demoTips) {
      await db.execute('INSERT INTO farmer_tips (title, content, category, icon) VALUES (?, ?, ?, ?)', tip);
    }
  }

  const [[{ count: offersCount }]] = await db.execute('SELECT COUNT(*) as count FROM seasonal_offers');
  if (offersCount === 0) {
    const demoOffers = [
      ['Monsoon Special', '20% off on all pesticides and fungicides', '20%', '2024-10-31', '🌧️'],
      ['Winter Preparation', 'Buy organic compost now, get 15% off on next purchase', '15%', '2024-11-30', '❄️']
    ];
    for (const offer of demoOffers) {
      await db.execute('INSERT INTO seasonal_offers (title, description, discount, valid_until, icon) VALUES (?, ?, ?, ?, ?)', offer);
    }
  }

  // Automated monthly credit reminders will be generated dynamically from real farmer credit balances
}

// Seed compatibility data
async function seedCompatibilityData() {
  const [[{ count: cropsCount }]] = await db.execute('SELECT COUNT(*) as count FROM crops');
  if (cropsCount === 0) {
    const demoCrops = [
      ['Rice', 'Cereal', 'Kharif'],
      ['Wheat', 'Cereal', 'Rabi'],
      ['Cotton', 'Fiber', 'Kharif'],
      ['Sugarcane', 'Cash', 'Annual'],
      ['Tomato', 'Vegetable', 'Annual'],
    ];
    for (const crop of demoCrops) {
      await db.execute('INSERT IGNORE INTO crops (name, type, season) VALUES (?, ?, ?)', crop);
    }
    console.log('Seeded demo crops');
  }

  const [products] = await db.execute('SELECT id, name FROM products');
  const idByName = new Map(products.map(p => [p.name, p.id]));
  const getId = (name) => idByName.get(name);

  const rules = [
    { a: 'Urea', b: 'Ammonium Sulfate', t: 'caution', r: 'Both are nitrogen sources; risk of excess N and soil acidification if over-applied.' },
    { a: 'Urea', b: 'Calcium Ammonium Nitrate', t: 'caution', r: 'Multiple nitrogen sources can cause vegetative overgrowth and nitrogen burn.' },
    { a: 'Ammonium Sulfate', b: 'Calcium Ammonium Nitrate', t: 'caution', r: 'High combined nitrogen; monitor crop stage and irrigation.' },
    { a: 'NPK 20-20-20', b: 'Muriate of Potash', t: 'caution', r: 'Both contribute potassium; avoid excess K and salt stress.' },
    { a: 'NPK 20-20-20', b: 'Sulfate of Potash', t: 'caution', r: 'Both contribute potassium; monitor EC and adjust rates.' },
    { a: 'NPK 20-20-20', b: 'DAP', t: 'caution', r: 'May oversupply N and P together; adjust based on soil test.' },
    { a: 'NPK 20-20-20', b: 'Single Super Phosphate', t: 'caution', r: 'May oversupply phosphorus; reduce total P application.' },
    { a: 'NPK 20-20-20', b: 'Triple Super Phosphate', t: 'caution', r: 'High total phosphorus; risk of nutrient imbalance (Zn/Fe tie-up).' },
    { a: 'DAP', b: 'Muriate of Potash', t: 'compatible', r: 'Common P+K combination for basal fertilization; apply as per soil test.' },
    { a: 'DAP', b: 'Sulfate of Potash', t: 'compatible', r: 'Good for chloride-sensitive crops needing P+K.' },
    { a: 'Single Super Phosphate', b: 'Muriate of Potash', t: 'compatible', r: 'Standard P+K blend for many field crops.' },
    { a: 'Single Super Phosphate', b: 'Sulfate of Potash', t: 'compatible', r: 'Useful where both P and K are needed with lower chloride.' },
    { a: 'Triple Super Phosphate', b: 'Muriate of Potash', t: 'compatible', r: 'Concentrated P with K; ensure balanced micronutrients.' },
    { a: 'Triple Super Phosphate', b: 'Sulfate of Potash', t: 'compatible', r: 'Concentrated P with K; suitable for horticulture when dosed correctly.' },
    { a: 'DAP', b: 'Single Super Phosphate', t: 'caution', r: 'Both supply phosphorus; avoid over-application and runoff losses.' },
    { a: 'DAP', b: 'Triple Super Phosphate', t: 'caution', r: 'Both are high P sources; adjust total P to prevent imbalance.' },
    { a: 'Single Super Phosphate', b: 'Triple Super Phosphate', t: 'caution', r: 'Duplicate P fertilizers; use one based on budget and requirement.' },
    { a: 'Organic Compost', b: 'Urea', t: 'compatible', r: 'Compost improves soil structure; urea provides quick N.' },
    { a: 'Organic Compost', b: 'DAP', t: 'compatible', r: 'Organic matter improves nutrient availability and reduces fixation.' },
    { a: 'Vermicompost', b: 'NPK 20-20-20', t: 'compatible', r: 'Organic carbon + balanced nutrients support steady growth.' },
    { a: 'Vermicompost', b: 'Muriate of Potash', t: 'compatible', r: 'Compost buffers salts; apply K as per crop stage.' },
    { a: 'Cow Manure', b: 'Urea', t: 'compatible', r: 'Combines slow + fast release nitrogen; avoid applying too close to harvest.' },
    { a: 'Neem Cake', b: 'Urea', t: 'compatible', r: 'Neem cake can slow nitrification and improve nitrogen use efficiency.' },
    { a: 'Neem Cake', b: 'Single Super Phosphate', t: 'compatible', r: 'Supports soil biology while adding phosphorus; good for basal use.' },
    { a: 'Humic Acid', b: 'NPK 20-20-20', t: 'compatible', r: 'Humic substances can improve nutrient uptake efficiency.' },
    { a: 'Humic Acid', b: 'DAP', t: 'compatible', r: 'Helps reduce fixation and improves root uptake.' },
    { a: 'Gypsum', b: 'Organic Compost', t: 'compatible', r: 'Gypsum improves soil structure; compost adds organic matter.' },
    { a: 'Gypsum', b: 'Muriate of Potash', t: 'caution', r: 'Salt load may increase; monitor soil EC and irrigation.' },
    { a: 'Zinc Sulfate', b: 'DAP', t: 'caution', r: 'Zinc availability may reduce when mixed with high phosphate; apply separately if possible.' },
    { a: 'Zinc Sulfate', b: 'Triple Super Phosphate', t: 'caution', r: 'High phosphate can reduce zinc uptake; consider split application.' },
    { a: 'Zinc Sulfate', b: 'NPK 20-20-20', t: 'compatible', r: 'Micronutrient supplement supports balanced fertilization.' },
    { a: 'Boron Fertilizer', b: 'Muriate of Potash', t: 'compatible', r: 'Boron + potassium often used together for flowering/fruiting crops.' },
    { a: 'Seaweed Extract', b: 'Humic Acid', t: 'compatible', r: 'Both support root development and stress tolerance.' },
    { a: 'Seaweed Extract', b: 'NPK 20-20-20', t: 'compatible', r: 'Biostimulant + nutrients can improve vigor under stress.' },
    { a: 'Carbendazim', b: 'Organic Compost', t: 'caution', r: 'Fungicide may reduce beneficial microbes temporarily; avoid direct mixing.' },
    { a: 'Malathion', b: 'Carbendazim', t: 'incompatible', r: 'Avoid tank-mixing insecticide and fungicide here; risk of reduced efficacy/chemical instability.' },
    { a: 'Glyphosate', b: 'NPK 20-20-20', t: 'caution', r: 'Avoid mixing herbicide with fertilizers; can reduce glyphosate performance and uptake.' },
    { a: 'Glyphosate', b: 'Gypsum', t: 'caution', r: 'Calcium/salts can reduce glyphosate activity; apply separately.' },
    { a: 'Glyphosate', b: 'Malathion', t: 'caution', r: 'Herbicide + insecticide together may stress crop and complicate timing; separate applications preferred.' }
  ];

  let inserted = 0;
  for (const rule of rules) {
    const id1 = getId(rule.a);
    const id2 = getId(rule.b);
    if (!id1 || !id2) continue;
    const p1 = Math.min(id1, id2);
    const p2 = Math.max(id1, id2);
    await db.execute(
      'INSERT IGNORE INTO product_compatibility (product1_id, product2_id, compatibility_type, reason, crop_specific) VALUES (?, ?, ?, ?, ?)',
      [p1, p2, rule.t, rule.r, 0]
    );
    inserted += 1;
  }

  const [[{ count: totalRules }]] = await db.execute('SELECT COUNT(*) as count FROM product_compatibility');
  console.log(`Ensured demo compatibility rules. Attempted inserts: ${inserted}. Total rules: ${totalRules}`);

  // Seed crop-specific compatibility
  const [[{ count: cropCompCount }]] = await db.execute('SELECT COUNT(*) as count FROM product_crop_compatibility');
  if (cropCompCount === 0) {
    const cropRules = [
      { p: 'Urea', c: 'Rice', n: 'Essential for tillering phase. Apply in 3 splits.', d: '100-120 kg/ha', w: 'Avoid application during heavy rain to prevent leaching.' },
      { p: 'DAP', c: 'Wheat', n: 'Apply as basal dose during sowing for better root establishment.', d: '50-60 kg/ha', w: 'Ensure proper soil moisture at application.' },
      { p: 'NPK 20-20-20', c: 'Tomato', n: 'Supports balanced growth and fruit development.', d: '25-30 kg/ha via fertigation', w: 'Monitor soil pH regularly.' },
      { p: 'Organic Compost', c: 'Sugarcane', n: 'Base application improves soil structure for long-duration crop.', d: '10-15 tonnes/ha', w: 'Must be well-decomposed.' }
    ];

    for (const rule of cropRules) {
      const productId = getId(rule.p);
      const [[crop]] = await db.execute('SELECT id FROM crops WHERE name = ?', [rule.c]);
      if (productId && crop) {
        await db.execute(
          'INSERT IGNORE INTO product_crop_compatibility (product_id, crop_id, compatibility_notes, recommended_dosage, warnings) VALUES (?, ?, ?, ?, ?)',
          [productId, crop.id, rule.n, rule.d, rule.w]
        );
      }
    }
    console.log('Seeded crop-specific compatibility rules');
  }
}

async function seedGovernmentSchemes() {
  const [[{ count: schemeCount }]] = await db.execute('SELECT COUNT(*) as count FROM government_schemes');
  if (schemeCount === 0) {
    const schemes = [
      {
        name: 'PM-KISAN',
        fullName: 'Pradhan Mantri Kisan Samman Nidhi',
        description: 'Income support scheme for farmers providing ₹6,000 per year in three installments.',
        eligibility: JSON.stringify(['Small and marginal farmers', 'Landholding farmers', 'Valid Aadhaar number']),
        benefits: '₹2,000 per installment (3 installments per year)',
        application: JSON.stringify(['Visit PM-KISAN portal', 'Register with Aadhaar', 'Verify land records']),
        link: 'https://pmkisan.gov.in/'
      },
      {
        name: 'Soil Health Card',
        fullName: 'Soil Health Card Scheme',
        description: 'Provides soil health assessment and recommendations for optimal fertilizer use.',
        eligibility: JSON.stringify(['All farmers', 'Landholding farmers']),
        benefits: 'Free soil testing, nutrient recommendations, fertilizer guidance',
        application: JSON.stringify(['Contact local agriculture office', 'Provide land details', 'Soil sample collection']),
        link: 'https://soilhealth.dac.gov.in/'
      }
    ];

    for (const scheme of schemes) {
      await db.execute(
        'INSERT INTO government_schemes (name, fullName, description, eligibility, benefits, application, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [scheme.name, scheme.fullName, scheme.description, scheme.eligibility, scheme.benefits, scheme.application, scheme.link]
      );
    }
    console.log('Government schemes seeded');
  }
}

// ── Routes ──────────────────────────────────────────────────────────────────

// Send OTP to email before registration
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Check if email already registered
  const [[existing]] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any old OTPs for this email
  await db.execute('DELETE FROM email_otps WHERE email = ?', [email]);

  // Save new OTP
  await db.execute(
    'INSERT INTO email_otps (email, otp, expires_at) VALUES (?, ?, ?)',
    [email, otp, expiresAt]
  );

  // Always log OTP to terminal for easy testing
  console.log(`\n========================================`);
  console.log(`  OTP for ${email}: ${otp}`);
  console.log(`  Expires in 10 minutes`);
  console.log(`========================================\n`);

  // Try to send email — if it fails, OTP is still usable from terminal
  try {
    await transporter.sendMail({
      from: `"Fertilizer Shop" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Fertilizer Shop Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #16a34a; text-align: center;">🌱 Fertilizer Shop</h2>
          <h3 style="text-align: center;">Email Verification</h3>
          <p>Hello! Use the OTP below to verify your email and complete registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #16a34a; background: #f0fdf4; padding: 15px 25px; border-radius: 10px; border: 2px dashed #16a34a;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">This OTP expires in <strong>10 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px; text-align: center;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Email send error:', err.message);
    // OTP is saved in DB — return success so user can check terminal or get OTP another way
    res.json({ message: 'OTP generated (check server terminal if email not received)' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const [[record]] = await db.execute(
    'SELECT * FROM email_otps WHERE email = ? AND otp = ?',
    [email, otp]
  );

  if (!record) return res.status(400).json({ error: 'Invalid OTP' });

  // Timezone-safe expiration check in JS
  const now = new Date();
  const expiresAt = new Date(record.expires_at);
  if (now > expiresAt) return res.status(400).json({ error: 'OTP has expired' });

  // Internal: Do NOT delete OTP here anymore. 
  // We'll delete it in /register after the account is actually created.
  // This prevents the "OTP used but registration failed" trap.

  res.json({ message: 'OTP verified successfully', verified: true });
});

// Government Schemes Endpoint
app.get('/api/government-schemes', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM government_schemes');
    const schemes = rows.map(row => ({
      ...row,
      eligibility: row.eligibility ? JSON.parse(row.eligibility) : [],
      application: row.application ? JSON.parse(row.application) : []
    }));
    res.json(schemes);
  } catch (error) {
    console.error('Error fetching government schemes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Dashboard & Analytics Endpoints ─────────────────────────────────────────

app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
  try {
    const shopId = req.user.shop_id || 1;
    // Calculate total revenue from sales table and income payments
    const [[{ salesTotal }]] = await db.execute("SELECT SUM(total_amount) as salesTotal FROM sales WHERE shop_id = ?", [shopId]);
    const [[{ paymentIncome }]] = await db.execute("SELECT SUM(amount) as paymentIncome FROM payments WHERE payment_type = 'income' AND shop_id = ?", [shopId]);
    
    // Use salesTotal or paymentIncome (whichever is recorded and accurate)
    const totalRevenue = Number(salesTotal) || Number(paymentIncome) || 0;

    const [[{ totalProducts }]] = await db.execute('SELECT COUNT(*) as totalProducts FROM products WHERE shop_id = ?', [shopId]);
    const [[{ totalFarmers }]] = await db.execute('SELECT COUNT(*) as totalFarmers FROM farmers WHERE shop_id = ?', [shopId]);

    const [[{ totalSales }]] = await db.execute('SELECT COUNT(*) as totalSales FROM sales WHERE shop_id = ?', [shopId]);
    const totalTransactions = Number(totalSales) || 0;
    
    const avgOrderValue = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;

    // Efficiency Score Calculation
    // Current month efficiency
    const [[{ cmOrders }]] = await db.execute("SELECT COUNT(*) as cmOrders FROM orders WHERE shop_id = ? AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())", [req.user.shop_id || 1]);
    const [[{ cmDelivered }]] = await db.execute("SELECT COUNT(*) as cmDelivered FROM orders WHERE shop_id = ? AND status = 'delivered' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())", [req.user.shop_id || 1]);
    const cmEfficiency = cmOrders > 0 ? (cmDelivered / cmOrders) * 100 : 100;

    // Last month efficiency
    const [[{ lmOrders }]] = await db.execute("SELECT COUNT(*) as lmOrders FROM orders WHERE shop_id = ? AND MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)", [req.user.shop_id || 1]);
    const [[{ lmDelivered }]] = await db.execute("SELECT COUNT(*) as lmDelivered FROM orders WHERE shop_id = ? AND status = 'delivered' AND MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)", [req.user.shop_id || 1]);
    const lmEfficiency = lmOrders > 0 ? (lmDelivered / lmOrders) * 100 : 100;

    const efficiencyScore = Math.round(cmEfficiency);
    const efficiencyGrowth = Math.round(cmEfficiency - lmEfficiency);

    res.json({
      totalRevenue: totalRevenue || 0,
      totalProducts: totalProducts || 0,
      totalFarmers: totalFarmers || 0,
      averageOrderValue: avgOrderValue || 0,
      revenueGrowth: 12.5, // Logic for growth can be added here
      productGrowth: 5.2,
      customerGrowth: 8.1,
      orderGrowth: -2.3,
      efficiencyScore: efficiencyScore,
      efficiencyGrowth: efficiencyGrowth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/farmer-tips', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM farmer_tips WHERE shop_id = ? ORDER BY created_at DESC LIMIT 3', [req.user.shop_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/seasonal-offers', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM seasonal_offers WHERE valid_until > NOW() AND shop_id = ? ORDER BY valid_until ASC', [req.user.shop_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/credit-reminders', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM credit_reminders WHERE shop_id = ? ORDER BY due_date ASC', [req.user.shop_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/summary', verifyToken, async (req, res) => {
  try {
    // Monthly sales (combining sales and orders, replaced with payments for actual income)
    const [monthlySales] = await db.execute(`
      SELECT month, SUM(sales) as sales FROM (
        SELECT DATE_FORMAT(payment_date, '%b') as month, amount as sales, payment_date as date FROM payments WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND payment_type = 'income' AND shop_id = ?
      ) combined
      GROUP BY month
      ORDER BY MIN(date)
    `, [req.user.shop_id || 1]);

    // Category distribution
    const [categoryData] = await db.execute(`
      SELECT type as name, COUNT(*) as value
      FROM products
      WHERE shop_id = ?
      GROUP BY type
    `, [req.user.shop_id || 1]);

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const categoryWithColors = categoryData.map((item, i) => ({
      ...item,
      color: colors[i % colors.length]
    }));

    res.json({
      monthlySales,
      categoryData: categoryWithColors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Accounting & Inventory Endpoints ────────────────────────────────────────

app.get('/api/accounting/summary', verifyToken, async (req, res) => {
  try {
    const [[{ totalRevenue }]] = await db.execute('SELECT SUM(total_amount) as totalRevenue FROM sales WHERE shop_id = ?', [req.user.shop_id || 1]);
    // Simple 18% GST calculation for demonstration
    const totalGST = (totalRevenue || 0) * 0.18;

    const [recentInvoices] = await db.execute(`
      SELECT id, id as invoiceNumber, customer_name as customer, total_amount as totalAmount, 
             (total_amount * 0.18) as gstAmount, (total_amount * 0.82) as amount,
             DATE_FORMAT(sale_date, '%Y-%m-%d') as date, 'paid' as status
      FROM sales
      WHERE shop_id = ?
      ORDER BY sale_date DESC
      LIMIT 10
    `, [req.user.shop_id || 1]);

    res.json({
      totalRevenue: totalRevenue || 0,
      totalGST: totalGST,
      totalInvoices: recentInvoices.length,
      invoices: recentInvoices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/expiry', verifyToken, async (req, res) => {
  try {
    const shopId = req.user.shop_id || 1;
    const [rows] = await db.execute(`
      SELECT id, name as productName, type, description, batch_number as batchNumber, quantity, 
             DATE_FORMAT(expiry_date, '%Y-%m-%d') as expiryDate,
             COALESCE(DATEDIFF(expiry_date, NOW()), 9999) as daysUntilExpiry,
             supplier, price as cost, (price * quantity) as totalValue,
             CASE 
               WHEN expiry_date IS NULL THEN 'safe'
               WHEN expiry_date < NOW() THEN 'expired'
               WHEN DATEDIFF(expiry_date, NOW()) <= 7 THEN 'critical'
               WHEN DATEDIFF(expiry_date, NOW()) <= 30 THEN 'warning'
               ELSE 'safe'
             END as status
      FROM products
      WHERE (shop_id = ? OR (shop_id IS NULL AND ? = 1))
      ORDER BY 
        CASE 
          WHEN expiry_date IS NULL THEN 3
          WHEN expiry_date < NOW() THEN 0
          WHEN DATEDIFF(expiry_date, NOW()) <= 7 THEN 1
          WHEN DATEDIFF(expiry_date, NOW()) <= 30 THEN 2
          ELSE 3
        END,
        expiry_date ASC
    `, [shopId, shopId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return to supplier
app.post('/api/inventory/return-to-supplier', verifyToken, async (req, res) => {
  const { productId, quantity, reason, notes } = req.body;
  const returnQty = parseInt(quantity, 10);

  if (!productId || isNaN(returnQty) || returnQty <= 0) {
    return res.status(400).json({ error: 'Valid product ID and return quantity (> 0) are required.' });
  }

  const shopId = req.user.shop_id || 1;

  try {
    const [products] = await db.execute('SELECT * FROM products WHERE id = ? AND shop_id = ?', [productId, shopId]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = products[0];
    if (product.quantity < returnQty) {
      return res.status(400).json({ error: `Cannot return ${returnQty} units. Only ${product.quantity} units available in stock.` });
    }

    // Deduct quantity from products
    await db.execute('UPDATE products SET quantity = quantity - ? WHERE id = ? AND shop_id = ?', [returnQty, productId, shopId]);

    // If supplier exists, optionally adjust current_balance if return value credits back
    const returnValue = (parseFloat(product.price) || 0) * returnQty;
    let supplierId = null;
    if (product.supplier) {
      try {
        const [suppRows] = await db.execute('SELECT id FROM suppliers WHERE name = ? AND shop_id = ? LIMIT 1', [product.supplier, shopId]);
        if (suppRows.length > 0) {
          supplierId = suppRows[0].id;
        }
        await db.execute(
          'UPDATE suppliers SET current_balance = GREATEST(0, current_balance - ?) WHERE name = ? AND shop_id = ?',
          [returnValue, product.supplier, shopId]
        );
      } catch (suppErr) {
        console.warn('Could not auto-adjust supplier credit on return:', suppErr.message);
      }
    }

    // Generate formal Debit Note and record in supplier_returns
    const year = new Date().getFullYear();
    const [maxRows] = await db.execute('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM supplier_returns');
    const nextId = maxRows[0]?.next_id || 1;
    let debitNoteNo = `DN-${year}-${String(nextId).padStart(5, '0')}`;
    const [existingDn] = await db.execute('SELECT id FROM supplier_returns WHERE debit_note_no = ?', [debitNoteNo]);
    if (existingDn.length > 0) {
      debitNoteNo = `DN-${year}-${String(nextId).padStart(4, '0')}-${Date.now().toString().slice(-3)}`;
    }

    try {
      await db.execute(`
        INSERT INTO supplier_returns (
          shop_id, debit_note_no, supplier_id, supplier_name, product_id, product_name,
          batch_number, quantity, unit_price, total_amount, reason, status, settlement_type, notes, return_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        shopId,
        debitNoteNo,
        supplierId,
        product.supplier || 'Unassigned Supplier',
        productId,
        product.name,
        product.batch_number || null,
        returnQty,
        parseFloat(product.price) || 0,
        returnValue,
        reason || 'Defective / Expired Batch Return',
        'Approved',
        'Debit Note / Balance Deduction',
        notes || null,
        new Date().toISOString().split('T')[0]
      ]);
    } catch (insertErr) {
      console.warn('Could not record into supplier_returns table:', insertErr.message);
    }

    res.json({
      success: true,
      message: `Successfully returned ${returnQty} units of "${product.name}" to supplier ${product.supplier || 'N/A'}. Debit Note: ${debitNoteNo}.`,
      returnedQuantity: returnQty,
      remainingQuantity: product.quantity - returnQty,
      returnValue,
      debitNoteNo
    });
  } catch (err) {
    console.error('Error returning to supplier:', err);
    res.status(500).json({ error: err.message });
  }
});

// Dispose expired or damaged stock
app.post('/api/inventory/dispose', verifyToken, async (req, res) => {
  const { productId, quantity, reason, notes } = req.body;
  const disposeQty = parseInt(quantity, 10);

  if (!productId || isNaN(disposeQty) || disposeQty <= 0) {
    return res.status(400).json({ error: 'Valid product ID and disposal quantity (> 0) are required.' });
  }

  const shopId = req.user.shop_id || 1;

  try {
    const [products] = await db.execute('SELECT * FROM products WHERE id = ? AND shop_id = ?', [productId, shopId]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = products[0];
    if (product.quantity < disposeQty) {
      return res.status(400).json({ error: `Cannot dispose ${disposeQty} units. Only ${product.quantity} units available in stock.` });
    }

    // Deduct quantity from products
    await db.execute('UPDATE products SET quantity = quantity - ? WHERE id = ? AND shop_id = ?', [disposeQty, productId, shopId]);

    const lossValue = (parseFloat(product.price) || 0) * disposeQty;

    res.json({
      success: true,
      message: `Successfully disposed ${disposeQty} units of "${product.name}".`,
      disposedQuantity: disposeQty,
      remainingQuantity: product.quantity - disposeQty,
      lossValue
    });
  } catch (err) {
    console.error('Error disposing product:', err);
    res.status(500).json({ error: err.message });
  }
});


// Helper to ensure a supplier exists for the given shop
async function ensureSupplierExists(supplierName, shopId = 1, executor = db) {
  if (!supplierName || typeof supplierName !== 'string') return null;
  const trimmed = supplierName.trim();
  if (!trimmed) return null;
  try {
    await executor.execute(
      `INSERT IGNORE INTO suppliers (name, shop_id, status) VALUES (?, ?, 'active')`,
      [trimmed, shopId]
    );
  } catch (err) {
    console.error('ensureSupplierExists error:', err.message);
  }
}

// Suppliers Endpoints
app.get('/api/suppliers', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM suppliers WHERE shop_id = ? ORDER BY name ASC', [req.user.shop_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', verifyToken, async (req, res) => {
  const { name, contact_person, phone, email, address, credit_limit, current_balance, status } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO suppliers (name, contact_person, phone, email, address, credit_limit, current_balance, status, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        contact_person !== undefined ? contact_person : null,
        phone !== undefined ? phone : null,
        email !== undefined ? email : null,
        address !== undefined ? address : null,
        credit_limit !== undefined ? parseFloat(credit_limit) || 0 : 0,
        current_balance !== undefined ? parseFloat(current_balance) || 0 : 0,
        status || 'active',
        req.user.shop_id || 1
      ]
    );
    res.status(201).json({ id: result.insertId, name, contact_person, phone, email, address, credit_limit, current_balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, contact_person, phone, email, address, credit_limit, current_balance, status } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE suppliers
       SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, credit_limit = ?, current_balance = ?, status = ?
       WHERE id = ? AND shop_id = ?`,
      [
        name,
        contact_person !== undefined ? contact_person : null,
        phone !== undefined ? phone : null,
        email !== undefined ? email : null,
        address !== undefined ? address : null,
        credit_limit !== undefined ? parseFloat(credit_limit) || 0 : 0,
        current_balance !== undefined ? parseFloat(current_balance) || 0 : 0,
        status || 'active',
        id,
        req.user.shop_id || 1
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [check] = await db.execute('SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?', [id]);
    if (check[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete supplier with existing purchase orders' });
    }
    const [result] = await db.execute('DELETE FROM suppliers WHERE id = ? AND shop_id = ?', [id, req.user.shop_id || 1]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Purchase Orders Endpoints
app.get('/api/purchase-orders', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT po.*, s.name as supplier_name 
      FROM purchase_orders po 
      JOIN suppliers s ON po.supplier_id = s.id 
      WHERE po.shop_id = ?
      ORDER BY po.order_date DESC
    `, [req.user.shop_id || 1]);

    // Fetch items for each order
    for (let order of rows) {
      const [items] = await db.execute('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [order.id]);
      order.items = items;
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchase-orders', verifyToken, async (req, res) => {
  const { supplier_id, order_date, delivery_date, total_amount, items } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [orderResult] = await connection.execute(
      'INSERT INTO purchase_orders (supplier_id, order_date, delivery_date, total_amount, shop_id) VALUES (?, ?, ?, ?, ?)',
      [
        supplier_id,
        order_date !== undefined ? order_date : null,
        delivery_date !== undefined ? delivery_date : null,
        total_amount,
        req.user.shop_id || 1
      ]
    );
    const orderId = orderResult.insertId;

    for (let item of items) {
      await connection.execute(
        'INSERT INTO purchase_order_items (purchase_order_id, product_name, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_name, item.quantity, item.price_per_unit, item.total_price]
      );
    }

    // Update supplier balance
    await connection.execute(
      'UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?',
      [total_amount, supplier_id]
    );

    // Add to payments as expense
    await connection.execute(
      'INSERT INTO payments (purchase_order_id, amount, payment_method, payment_type, notes, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, total_amount, 'Bank Transfer', 'expense', `Purchase Order #${orderId}`, req.user.shop_id || 1]
    );

    await connection.commit();
    res.status(201).json({ id: orderId, message: 'Purchase order created successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/purchase-orders/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status, delivery_date } = req.body;
  try {
    const [result] = await db.execute(
      'UPDATE purchase_orders SET status = COALESCE(?, status), delivery_date = COALESCE(?, delivery_date) WHERE id = ? AND shop_id = ?',
      [status || null, delivery_date || null, id, req.user.shop_id || 1]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Purchase order not found' });
    res.json({ message: 'Purchase order updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/purchase-orders/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [[order]] = await connection.execute(
      'SELECT supplier_id, total_amount FROM purchase_orders WHERE id = ? AND shop_id = ?',
      [id, req.user.shop_id || 1]
    );
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    await connection.execute('DELETE FROM purchase_order_items WHERE purchase_order_id = ?', [id]);
    await connection.execute('DELETE FROM payments WHERE purchase_order_id = ?', [id]);
    await connection.execute(
      'UPDATE suppliers SET current_balance = GREATEST(current_balance - ?, 0) WHERE id = ?',
      [order.total_amount, order.supplier_id]
    );
    await connection.execute('DELETE FROM purchase_orders WHERE id = ? AND shop_id = ?', [id, req.user.shop_id || 1]);

    await connection.commit();
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// ==========================================
// SUPPLIER RETURNS & DEBIT NOTES (DEFECTIVE / EXPIRED BATCH CLAIMS)
// ==========================================

app.get('/api/supplier-returns', verifyToken, async (req, res) => {
  const shopId = req.user.shop_id || 1;
  const { search, supplier_id, status, reason } = req.query;

  try {
    let query = `
      SELECT sr.*, s.phone as supplier_phone, s.email as supplier_email, s.current_balance as supplier_balance
      FROM supplier_returns sr
      LEFT JOIN suppliers s ON sr.supplier_id = s.id
      WHERE sr.shop_id = ?
    `;
    const params = [shopId];

    if (supplier_id) {
      query += ` AND sr.supplier_id = ?`;
      params.push(supplier_id);
    }
    if (status) {
      query += ` AND sr.status = ?`;
      params.push(status);
    }
    if (reason) {
      query += ` AND sr.reason = ?`;
      params.push(reason);
    }
    if (search) {
      query += ` AND (sr.debit_note_no LIKE ? OR sr.supplier_name LIKE ? OR sr.product_name LIKE ? OR sr.batch_number LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY sr.created_at DESC`;
    const [returns] = await db.execute(query, params);

    // Compute summary metrics
    const [summaryRows] = await db.execute(`
      SELECT 
        COUNT(*) as total_claims,
        COALESCE(SUM(total_amount), 0) as total_deducted_amount,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'Pending Approval' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'Settled / Adjusted' THEN 1 END) as settled_count
      FROM supplier_returns
      WHERE shop_id = ?
    `, [shopId]);

    res.json({
      returns,
      summary: summaryRows[0] || {
        total_claims: 0,
        total_deducted_amount: 0,
        approved_count: 0,
        pending_count: 0,
        settled_count: 0
      }
    });
  } catch (err) {
    console.error('Error fetching supplier returns:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/supplier-returns/:id', verifyToken, async (req, res) => {
  const shopId = req.user.shop_id || 1;
  const { id } = req.params;

  try {
    const [rows] = await db.execute(`
      SELECT sr.*, s.contact_person, s.phone as supplier_phone, s.email as supplier_email, 
             s.address as supplier_address, s.current_balance as supplier_balance
      FROM supplier_returns sr
      LEFT JOIN suppliers s ON sr.supplier_id = s.id
      WHERE sr.id = ? AND sr.shop_id = ?
    `, [id, shopId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Supplier return / debit note not found' });
    }

    // Fetch shop settings for debit note memo print
    const [shopSettingsRows] = await db.execute('SELECT setting_key, setting_value FROM shop_settings WHERE shop_id = ?', [shopId]);
    const settings = {};
    shopSettingsRows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    res.json({
      returnItem: rows[0],
      shopSettings: settings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/supplier-returns', verifyToken, async (req, res) => {
  const shopId = req.user.shop_id || 1;
  const {
    supplier_id,
    supplier_name,
    product_id,
    quantity,
    unit_price,
    reason,
    settlement_type = 'Debit Note / Balance Deduction',
    status = 'Approved',
    notes,
    return_date
  } = req.body;

  const returnQty = parseInt(quantity, 10);
  if (!product_id || isNaN(returnQty) || returnQty <= 0) {
    return res.status(400).json({ error: 'Valid product and return quantity (> 0) are required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check product availability
    const [products] = await connection.execute('SELECT * FROM products WHERE id = ? AND shop_id = ? FOR UPDATE', [product_id, shopId]);
    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    if (product.quantity < returnQty) {
      await connection.rollback();
      return res.status(400).json({ error: `Cannot return ${returnQty} units. Only ${product.quantity} in stock.` });
    }

    const pricePerUnit = parseFloat(unit_price) || parseFloat(product.price) || 0;
    const totalAmount = parseFloat((pricePerUnit * returnQty).toFixed(2));
    const effectiveReturnDate = return_date || new Date().toISOString().split('T')[0];

    // Identify or verify supplier
    let finalSupplierId = supplier_id ? parseInt(supplier_id, 10) : null;
    let finalSupplierName = supplier_name || product.supplier || 'Unassigned Supplier';

    if (finalSupplierId) {
      const [suppRows] = await connection.execute('SELECT id, name FROM suppliers WHERE id = ? AND shop_id = ?', [finalSupplierId, shopId]);
      if (suppRows.length > 0) {
        finalSupplierName = suppRows[0].name;
      }
    } else if (finalSupplierName && finalSupplierName !== 'Unassigned Supplier') {
      const [suppRows] = await connection.execute('SELECT id FROM suppliers WHERE name = ? AND shop_id = ? LIMIT 1', [finalSupplierName, shopId]);
      if (suppRows.length > 0) {
        finalSupplierId = suppRows[0].id;
      }
    }

    // Generate unique debit note number: DN-YYYY-XXXXX
    const year = new Date().getFullYear();
    const [maxRows] = await connection.execute('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM supplier_returns');
    const nextId = maxRows[0]?.next_id || 1;
    let debitNoteNo = `DN-${year}-${String(nextId).padStart(5, '0')}`;
    const [existingDn] = await connection.execute('SELECT id FROM supplier_returns WHERE debit_note_no = ?', [debitNoteNo]);
    if (existingDn.length > 0) {
      debitNoteNo = `DN-${year}-${String(nextId).padStart(4, '0')}-${Date.now().toString().slice(-3)}`;
    }

    // Deduct stock from products
    await connection.execute('UPDATE products SET quantity = quantity - ? WHERE id = ? AND shop_id = ?', [returnQty, product_id, shopId]);

    // If status is Approved and settlement is Debit Note, deduct from supplier balance
    if (status === 'Approved' && settlement_type === 'Debit Note / Balance Deduction' && finalSupplierId) {
      await connection.execute(
        'UPDATE suppliers SET current_balance = GREATEST(0, current_balance - ?) WHERE id = ? AND shop_id = ?',
        [totalAmount, finalSupplierId, shopId]
      );
    }

    // Insert record into supplier_returns
    const [insertResult] = await connection.execute(`
      INSERT INTO supplier_returns (
        shop_id, debit_note_no, supplier_id, supplier_name, product_id, product_name,
        batch_number, quantity, unit_price, total_amount, reason, status, settlement_type, notes, return_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      shopId,
      debitNoteNo,
      finalSupplierId,
      finalSupplierName,
      product_id,
      product.name,
      product.batch_number || null,
      returnQty,
      pricePerUnit,
      totalAmount,
      reason || 'Defective Batch',
      status,
      settlement_type,
      notes || null,
      effectiveReturnDate
    ]);

    await connection.commit();

    res.status(201).json({
      success: true,
      id: insertResult.insertId,
      debitNoteNo,
      message: `Debit Note ${debitNoteNo} generated. Successfully returned ${returnQty} units of "${product.name}" to supplier ${finalSupplierName}.`,
      totalAmount,
      remainingStock: product.quantity - returnQty
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error creating supplier return:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.put('/api/supplier-returns/:id/status', verifyToken, async (req, res) => {
  const shopId = req.user.shop_id || 1;
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['Pending Approval', 'Approved', 'Settled / Adjusted', 'Rejected'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute('SELECT * FROM supplier_returns WHERE id = ? AND shop_id = ? FOR UPDATE', [id, shopId]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Supplier return not found' });
    }

    const currentReturn = rows[0];
    const prevStatus = currentReturn.status;

    // If changing from non-approved to Approved and Debit Note settlement, apply balance deduction
    if (prevStatus !== 'Approved' && status === 'Approved' && currentReturn.settlement_type === 'Debit Note / Balance Deduction' && currentReturn.supplier_id) {
      await connection.execute(
        'UPDATE suppliers SET current_balance = GREATEST(0, current_balance - ?) WHERE id = ? AND shop_id = ?',
        [currentReturn.total_amount, currentReturn.supplier_id, shopId]
      );
    }

    // If changing from Approved to Rejected, restore supplier balance
    if (prevStatus === 'Approved' && status === 'Rejected' && currentReturn.settlement_type === 'Debit Note / Balance Deduction' && currentReturn.supplier_id) {
      await connection.execute(
        'UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ? AND shop_id = ?',
        [currentReturn.total_amount, currentReturn.supplier_id, shopId]
      );
    }

    await connection.execute(
      'UPDATE supplier_returns SET status = ?, notes = COALESCE(?, notes), updated_at = NOW() WHERE id = ? AND shop_id = ?',
      [status, notes || null, id, shopId]
    );

    await connection.commit();
    res.json({ success: true, message: `Return status updated to "${status}" successfully.` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/supplier-returns/:id', verifyToken, async (req, res) => {
  const shopId = req.user.shop_id || 1;
  const { id } = req.params;
  const restoreStock = req.query.restore === 'true';

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute('SELECT * FROM supplier_returns WHERE id = ? AND shop_id = ?', [id, shopId]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Supplier return not found' });
    }

    const ret = rows[0];

    // If restoring stock
    if (restoreStock && ret.product_id) {
      await connection.execute('UPDATE products SET quantity = quantity + ? WHERE id = ? AND shop_id = ?', [ret.quantity, ret.product_id, shopId]);
    }

    // If return was approved and balance was deducted, restore supplier balance
    if (ret.status === 'Approved' && ret.settlement_type === 'Debit Note / Balance Deduction' && ret.supplier_id) {
      await connection.execute(
        'UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ? AND shop_id = ?',
        [ret.total_amount, ret.supplier_id, shopId]
      );
    }

    await connection.execute('DELETE FROM supplier_returns WHERE id = ? AND shop_id = ?', [id, shopId]);

    await connection.commit();
    res.json({ success: true, message: `Supplier return ${ret.debit_note_no} deleted successfully.` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// ==========================================
// DAILY CASH DRAWER & DAY-END CLOSING SETTLEMENT
// ==========================================

app.get('/api/cash-drawer/current', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const shopId = req.user.shop_id || 1;

  try {
    // Check for active OPEN session
    const [openSessions] = await db.execute(
      'SELECT * FROM cash_drawer_sessions WHERE shop_id = ? AND status = "OPEN" ORDER BY opened_at DESC LIMIT 1',
      [shopId]
    );

    // Fetch last closed session if any
    const [closedSessions] = await db.execute(
      'SELECT * FROM cash_drawer_sessions WHERE shop_id = ? AND status = "CLOSED" ORDER BY closed_at DESC LIMIT 1',
      [shopId]
    );
    const lastClosedSession = closedSessions.length > 0 ? closedSessions[0] : null;

    if (openSessions.length === 0) {
      return res.json({
        isOpen: false,
        session: null,
        activeSession: null,
        liveStats: null,
        liveSales: {
          cashSales: 0,
          onlineSales: 0,
          creditSales: 0,
          totalSales: 0,
          cashSalesCount: 0,
          onlineSalesCount: 0,
          creditSalesCount: 0,
          totalSalesCount: 0
        },
        liveCashIn: 0,
        liveCashOut: 0,
        expectedCash: 0,
        transactions: [],
        lastClosedSession
      });
    }

    const session = openSessions[0];

    // Compute live sales since session opened
    const [salesStats] = await db.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) NOT IN ('cash', 'credit') THEN total_amount ELSE 0 END), 0) as online_sales,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'credit' THEN total_amount ELSE 0 END), 0) as credit_sales,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(CASE WHEN LOWER(payment_method) = 'cash' THEN 1 END) as cash_sales_count,
        COUNT(*) as total_sales_count
      FROM sales
      WHERE shop_id = ? AND sale_date >= ?
    `, [shopId, session.opened_at]);

    // Compute manual cash in and cash out transactions
    const [txStats] = await db.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'CASH_IN' AND category != 'Opening Float' THEN amount ELSE 0 END), 0) as cash_in,
        COALESCE(SUM(CASE WHEN type = 'CASH_OUT' THEN amount ELSE 0 END), 0) as cash_out
      FROM cash_drawer_transactions
      WHERE session_id = ? AND shop_id = ?
    `, [session.id, shopId]);

    // Fetch all transactions for this session
    const [transactions] = await db.execute(
      'SELECT * FROM cash_drawer_transactions WHERE session_id = ? AND shop_id = ? ORDER BY created_at DESC',
      [session.id, shopId]
    );

    const openingCash = parseFloat(session.opening_cash) || 0;
    const cashSales = parseFloat(salesStats[0]?.cash_sales) || 0;
    const onlineSales = parseFloat(salesStats[0]?.online_sales) || 0;
    const creditSales = parseFloat(salesStats[0]?.credit_sales) || 0;
    const totalSales = parseFloat(salesStats[0]?.total_sales) || 0;
    const cashSalesCount = parseInt(salesStats[0]?.cash_sales_count, 10) || 0;
    const totalSalesCount = parseInt(salesStats[0]?.total_sales_count, 10) || 0;
    const cashIn = parseFloat(txStats[0]?.cash_in) || 0;
    const cashOut = parseFloat(txStats[0]?.cash_out) || 0;
    const expectedCash = parseFloat((openingCash + cashSales + cashIn - cashOut).toFixed(2));

    const liveStats = {
      openingCash,
      cashSales,
      onlineSales,
      creditSales,
      totalSales,
      cashSalesCount,
      totalSalesCount,
      cashIn,
      cashOut,
      expectedCash
    };

    const liveSales = {
      cashSales,
      onlineSales,
      creditSales,
      totalSales,
      cashSalesCount,
      onlineSalesCount: Math.max(0, totalSalesCount - cashSalesCount),
      creditSalesCount: 0,
      totalSalesCount
    };

    res.json({
      isOpen: true,
      session,
      activeSession: session,
      liveStats,
      liveSales,
      liveCashIn: cashIn,
      liveCashOut: cashOut,
      expectedCash,
      transactions,
      lastClosedSession
    });
  } catch (err) {
    console.error('Error fetching cash drawer status:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cash-drawer/open', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const shopId = req.user.shop_id || 1;
  const { opening_cash, notes } = req.body;

  const openingFloat = parseFloat(opening_cash);
  if (isNaN(openingFloat) || openingFloat < 0) {
    return res.status(400).json({ error: 'Valid opening cash float (>= 0) is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      'SELECT id, session_code FROM cash_drawer_sessions WHERE shop_id = ? AND status = "OPEN" LIMIT 1',
      [shopId]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: `Drawer is already OPEN (Session: ${existing[0].session_code}). Please close it first.` });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const [countRows] = await connection.execute('SELECT COUNT(*) as cnt FROM cash_drawer_sessions WHERE shop_id = ?', [shopId]);
    const seq = (countRows[0]?.cnt || 0) + 1;
    const sessionCode = `CDS-${dateStr.replace(/-/g, '')}-${String(seq).padStart(4, '0')}`;

    const [insertResult] = await connection.execute(`
      INSERT INTO cash_drawer_sessions (
        shop_id, session_code, session_date, opened_by, opened_by_name, opening_cash,
        status, expected_cash, closing_notes
      ) VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
    `, [
      shopId,
      sessionCode,
      dateStr,
      req.user.id || null,
      req.user.username || 'Shop Manager',
      openingFloat,
      openingFloat,
      notes || null
    ]);

    const sessionId = insertResult.insertId;

    // Log opening float transaction
    await connection.execute(`
      INSERT INTO cash_drawer_transactions (
        session_id, shop_id, type, amount, category, description, created_by_name
      ) VALUES (?, ?, 'CASH_IN', ?, 'Opening Float', 'Starting morning cash float in drawer', ?)
    `, [
      sessionId,
      shopId,
      openingFloat,
      req.user.username || 'Shop Manager'
    ]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Cash Drawer session ${sessionCode} opened with ₹${openingFloat.toLocaleString()} float.`,
      sessionId,
      session_id: sessionId,
      sessionCode,
      session_code: sessionCode
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error opening cash drawer:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.post('/api/cash-drawer/expense', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const shopId = req.user.shop_id || 1;
  const { amount, category, description } = req.body;

  const expenseAmt = parseFloat(amount);
  if (isNaN(expenseAmt) || expenseAmt <= 0) {
    return res.status(400).json({ error: 'Valid expense amount (> 0) is required' });
  }

  try {
    const [sessions] = await db.execute(
      'SELECT id FROM cash_drawer_sessions WHERE shop_id = ? AND status = "OPEN" LIMIT 1',
      [shopId]
    );
    if (sessions.length === 0) {
      return res.status(400).json({ error: 'No active cash drawer session is open. Please open drawer first.' });
    }

    const sessionId = sessions[0].id;
    await db.execute(`
      INSERT INTO cash_drawer_transactions (
        session_id, shop_id, type, amount, category, description, created_by_name
      ) VALUES (?, ?, 'CASH_OUT', ?, ?, ?, ?)
    `, [
      sessionId,
      shopId,
      expenseAmt,
      category || 'labor',
      description || null,
      req.user.username || 'Staff'
    ]);

    res.status(201).json({
      success: true,
      message: `Cash expense of ₹${expenseAmt.toFixed(2)} recorded successfully.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cash-drawer/cash-in', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const shopId = req.user.shop_id || 1;
  const { amount, category, description } = req.body;

  const inAmt = parseFloat(amount);
  if (isNaN(inAmt) || inAmt <= 0) {
    return res.status(400).json({ error: 'Valid cash addition amount (> 0) is required' });
  }

  try {
    const [sessions] = await db.execute(
      'SELECT id FROM cash_drawer_sessions WHERE shop_id = ? AND status = "OPEN" LIMIT 1',
      [shopId]
    );
    if (sessions.length === 0) {
      return res.status(400).json({ error: 'No active cash drawer session is open. Please open drawer first.' });
    }

    const sessionId = sessions[0].id;
    await db.execute(`
      INSERT INTO cash_drawer_transactions (
        session_id, shop_id, type, amount, category, description, created_by_name
      ) VALUES (?, ?, 'CASH_IN', ?, ?, ?, ?)
    `, [
      sessionId,
      shopId,
      inAmt,
      category || 'change_float',
      description || null,
      req.user.username || 'Staff'
    ]);

    res.status(201).json({
      success: true,
      message: `Cash addition of ₹${inAmt.toFixed(2)} recorded into drawer.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cash-drawer/close', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const shopId = req.user.shop_id || 1;
  const { actual_cash, denominations, handover_to, closing_notes } = req.body;

  const countedCash = parseFloat(actual_cash);
  if (isNaN(countedCash) || countedCash < 0) {
    return res.status(400).json({ error: 'Valid actual counted cash (>= 0) is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [openSessions] = await connection.execute(
      'SELECT * FROM cash_drawer_sessions WHERE shop_id = ? AND status = "OPEN" LIMIT 1 FOR UPDATE',
      [shopId]
    );
    if (openSessions.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No open drawer session found to close' });
    }

    const session = openSessions[0];

    // Compute sales totals
    const [salesStats] = await connection.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) NOT IN ('cash', 'credit') THEN total_amount ELSE 0 END), 0) as online_sales,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'credit' THEN total_amount ELSE 0 END), 0) as credit_sales,
        COALESCE(SUM(total_amount), 0) as total_sales
      FROM sales
      WHERE shop_id = ? AND sale_date >= ?
    `, [shopId, session.opened_at]);

    // Compute cash in/out
    const [txStats] = await connection.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'CASH_IN' AND category != 'Opening Float' THEN amount ELSE 0 END), 0) as cash_in,
        COALESCE(SUM(CASE WHEN type = 'CASH_OUT' THEN amount ELSE 0 END), 0) as cash_out
      FROM cash_drawer_transactions
      WHERE session_id = ? AND shop_id = ?
    `, [session.id, shopId]);

    const openingCash = parseFloat(session.opening_cash) || 0;
    const cashSales = parseFloat(salesStats[0]?.cash_sales) || 0;
    const onlineSales = parseFloat(salesStats[0]?.online_sales) || 0;
    const creditSales = parseFloat(salesStats[0]?.credit_sales) || 0;
    const totalSales = parseFloat(salesStats[0]?.total_sales) || 0;
    const cashIn = parseFloat(txStats[0]?.cash_in) || 0;
    const cashOut = parseFloat(txStats[0]?.cash_out) || 0;
    const expectedCash = parseFloat((openingCash + cashSales + cashIn - cashOut).toFixed(2));
    const difference = parseFloat((countedCash - expectedCash).toFixed(2));

    const denomJson = typeof denominations === 'object' ? JSON.stringify(denominations) : (denominations || null);

    await connection.execute(`
      UPDATE cash_drawer_sessions
      SET 
        closed_by = ?,
        closed_by_name = ?,
        closed_at = NOW(),
        status = 'CLOSED',
        expected_cash = ?,
        actual_cash = ?,
        difference = ?,
        cash_sales_amount = ?,
        online_sales_amount = ?,
        credit_sales_amount = ?,
        total_sales_amount = ?,
        cash_in_manual = ?,
        cash_out_expenses = ?,
        denominations = ?,
        handover_to = ?,
        closing_notes = ?
      WHERE id = ? AND shop_id = ?
    `, [
      req.user.id || null,
      req.user.username || 'Shop Manager',
      expectedCash,
      countedCash,
      difference,
      cashSales,
      onlineSales,
      creditSales,
      totalSales,
      cashIn,
      cashOut,
      denomJson,
      handover_to || 'Store Owner',
      closing_notes || null,
      session.id,
      shopId
    ]);

    await connection.commit();

    const settlement = {
      sessionId: session.id,
      session_id: session.id,
      sessionCode: session.session_code,
      session_code: session.session_code,
      status: 'CLOSED',
      openingCash,
      cashSales,
      onlineSales,
      creditSales,
      totalSales,
      cashIn,
      cashOut,
      expected_cash: expectedCash,
      actual_cash: countedCash,
      difference,
      handoverTo: handover_to
    };

    res.json({
      success: true,
      message: `Drawer session ${session.session_code} closed. Discrepancy: ${difference >= 0 ? `+₹${difference}` : `-₹${Math.abs(difference)}`}.`,
      settlement,
      summary: settlement
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error closing cash drawer:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.get('/api/cash-drawer/history', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const shopId = req.user.shop_id || 1;
  const numLimit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 30));

  try {
    const [rows] = await db.query(
      `SELECT * FROM cash_drawer_sessions WHERE shop_id = ? ORDER BY id DESC LIMIT ${numLimit}`,
      [shopId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cash-drawer/session/:id', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const shopId = req.user.shop_id || 1;
  const { id } = req.params;

  try {
    const [sessions] = await db.execute(
      'SELECT * FROM cash_drawer_sessions WHERE id = ? AND shop_id = ?',
      [id, shopId]
    );
    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const [transactions] = await db.execute(
      'SELECT * FROM cash_drawer_transactions WHERE session_id = ? AND shop_id = ? ORDER BY created_at ASC',
      [id, shopId]
    );

    const [settingsRows] = await db.execute(
      'SELECT setting_key, setting_value FROM shop_settings WHERE shop_id = ?',
      [shopId]
    );
    const shopSettings = {};
    settingsRows.forEach(r => { shopSettings[r.setting_key] = r.setting_value; });

    res.json({
      session: sessions[0],
      transactions,
      shopSettings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payments Endpoints
app.get('/api/payments', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, s.customer_name, po.supplier_id, sup.name as supplier_name
      FROM payments p
      LEFT JOIN sales s ON p.sale_id = s.id
      LEFT JOIN purchase_orders po ON p.purchase_order_id = po.id
      LEFT JOIN suppliers sup ON po.supplier_id = sup.id
      WHERE p.shop_id = ?
      ORDER BY p.payment_date DESC
    `, [req.user.shop_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', verifyToken, async (req, res) => {
  const { sale_id, purchase_order_id, amount, payment_method, payment_type, status, notes } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO payments (sale_id, purchase_order_id, amount, payment_method, payment_type, status, notes, shop_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sale_id || null,
        purchase_order_id || null,
        amount,
        payment_method || 'Cash',
        payment_type,
        status || 'completed',
        notes || null,
        req.user.shop_id || 1
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/payments/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { amount, payment_method, status, notes } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE payments
       SET amount = COALESCE(?, amount),
           payment_method = COALESCE(?, payment_method),
           status = COALESCE(?, status),
           notes = COALESCE(?, notes)
       WHERE id = ? AND shop_id = ?`,
      [amount ?? null, payment_method || null, status || null, notes || null, id, req.user.shop_id || 1]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/payments/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM payments WHERE id = ? AND shop_id = ?', [id, req.user.shop_id || 1]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/smart-assistant/query', verifyToken, async (req, res) => {
  const { message = '', farmData = {} } = req.body;
  const lowerMsg = message.toLowerCase();
  const crop = farmData?.mainCrop || 'General Crop';
  const farmSize = farmData?.farmSize || 5;

  let responseText = '';

  // 1. Weather Queries
  if (lowerMsg.includes('weather') || lowerMsg.includes('rain') || lowerMsg.includes('temp') || lowerMsg.includes('forecast')) {
    responseText = `🌤️ Weather Advisory: Currently, weather patterns indicate moderate conditions. If humidity exceeds 70% or rain is forecast, delay chemical foliar spraying and top-dressing urea by 24-48 hours to prevent wash-off into drainage channels.`;
  }
  // 2. Fertilizer & NPK Dosages
  else if (lowerMsg.includes('fertilizer') || lowerMsg.includes('npk') || lowerMsg.includes('urea') || lowerMsg.includes('dap') || lowerMsg.includes('dosage')) {
    if (lowerMsg.includes('rice') || crop.toLowerCase() === 'rice') {
      responseText = `🌾 Rice / Paddy Fertilizer Recommendation:
• Basal Dose: Apply DAP (50 kg/acre) + MOP (25 kg/acre) + Zinc Sulphate (10 kg/acre) during puddling.
• 1st Top Dressing (20-25 DAT): Neem Coated Urea (30-35 kg/acre).
• 2nd Top Dressing (Panicle Initiation): Urea (30 kg/acre) + MOP (15 kg/acre). Avoid mixing Zinc directly with DAP.`;
    } else if (lowerMsg.includes('wheat') || crop.toLowerCase() === 'wheat') {
      responseText = `🌾 Wheat Fertilizer Recommendation:
• Basal: 55 kg DAP + 20 kg MOP per acre at sowing time.
• 1st Irrigation (CRI Stage, 21 days): 45 kg Urea per acre.
• 2nd Irrigation: 45 kg Urea per acre. Ensure proper soil moisture before top-dressing.`;
    } else if (lowerMsg.includes('cotton') || crop.toLowerCase() === 'cotton') {
      responseText = `🌱 Cotton Nutrient Schedule:
• Total per acre: 60 kg N, 30 kg P, 30 kg K.
• Apply all P & K basal, and split Nitrogen into 3 equal doses at 30, 60, and 90 days after sowing.`;
    } else {
      responseText = `🌱 General Fertilizer Advisory for ${crop} (${farmSize} acres):
• Standard Split: Apply full Phosphorus (DAP/SSP) and Potash (MOP) as basal dose at sowing.
• Split Nitrogen (Urea) into 2 to 3 doses to minimize leaching loss and maximize plant uptake.`;
    }
  }
  // 3. Pest & Disease Diagnostics
  else if (lowerMsg.includes('pest') || lowerMsg.includes('disease') || lowerMsg.includes('fungus') || lowerMsg.includes('yellow') || lowerMsg.includes('insect') || lowerMsg.includes('rot') || lowerMsg.includes('blast')) {
    if (lowerMsg.includes('yellow') || lowerMsg.includes('leaf')) {
      responseText = `🍃 Yellowing Leaves Diagnostic:
• Lower older leaves yellowing: Nitrogen deficiency. Top-dress with Urea or spray 1% Urea solution.
• Interveinal yellowing (green veins): Zinc or Magnesium deficiency. Foliar spray Chelated Zinc (1-2 g/L).
• Tips burning/curling: Potassium deficiency or salt stress.`;
    } else if (lowerMsg.includes('blast') || lowerMsg.includes('blight') || lowerMsg.includes('fung')) {
      responseText = `🛡️ Fungal Blight / Blast Treatment:
• Spray Tricyclazole 75% WP @ 0.6 g/L or Azoxystrobin + Difenoconazole @ 1 ml/L.
• Avoid excessive nitrogen application during active fungal outbreaks.`;
    } else {
      responseText = `🐛 Integrated Pest Management (IPM):
• Sucking pests (Aphids, Jassids): Spray Neem oil (1500 ppm @ 3-5 ml/L) or Imidacloprid 17.8% SL @ 0.5 ml/L.
• Stem borer / Caterpillars: Apply Chlorantraniliprole 18.5% SC @ 0.3 ml/L. Always wear safety gear during application.`;
    }
  }
  // 4. Government Schemes & Subsidies
  else if (lowerMsg.includes('scheme') || lowerMsg.includes('subsidy') || lowerMsg.includes('pm kisan') || lowerMsg.includes('yojana')) {
    responseText = `🏛️ Active Agricultural Schemes & Subsidies:
1. PM-KISAN: ₹6,000/year in 3 equal installments directly to farmer bank accounts.
2. Fertilizer Subsidy (DBT): Urea sold at fixed MRP of ₹242/45kg bag; P&K under NBS (Nutrient Based Subsidy).
3. PM Fasal Bima Yojana (PMFBY): Crop insurance against drought, unseasonal rains, and pests.
4. Soil Health Card Scheme: Free soil testing for N, P, K, pH, and micronutrients every 2 years.`;
  }
  // 5. Stock & Shop Inventory
  else if (lowerMsg.includes('stock') || lowerMsg.includes('inventory') || lowerMsg.includes('available')) {
    try {
      const [topProducts] = await db.execute(
        'SELECT name, quantity, price FROM products WHERE shop_id = ? AND quantity > 0 ORDER BY quantity DESC LIMIT 3',
        [req.user.shop_id || 1]
      );
      if (topProducts.length > 0) {
        const prodList = topProducts.map(p => `• ${p.name}: ${p.quantity} bags (₹${parseFloat(p.price).toFixed(0)})`).join('\n');
        responseText = `📦 Current In-Stock Fast Moving Fertilizers:\n${prodList}\n\nVisit the Shop tab to place online orders or book counter delivery.`;
      } else {
        responseText = `📦 We have fresh stock coming in this week. Please check the Shop catalog for active availability.`;
      }
    } catch {
      responseText = `📦 Store inventory is active. Check the Products catalog for real-time bag counts and prices.`;
    }
  }
  // 6. Natural Language Fallback
  else {
    responseText = `🧑‍🌾 Hello! As your Agricultural AI Assistant, I can guide you on:
• Specific NPK dosage and fertilizer schedules for ${crop}.
• Diagnosing leaf yellowing, fungal blight, and pest attacks.
• Checking mixing compatibility between chemicals (e.g. Zinc & DAP).
• PM-KISAN, crop insurance, and government subsidy schemes.
What crop or symptom would you like advice on?`;
  }

  res.json({ text: responseText });
});

// Register user
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, role, otp, shop_name, shop_slug, phone } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  // To ensure atomicity and security, we RE-VERIFY the OTP here
  // This handles the case where someone might bypass the frontend OTP step
  const [[otpRecord]] = await db.execute(
    'SELECT * FROM email_otps WHERE email = ? AND otp = ?',
    [email, otp]
  );

  if (!otpRecord) return res.status(400).json({ error: 'OTP verification required or invalid OTP' });

  const now = new Date();
  const expiresAt = new Date(otpRecord.expires_at);
  if (now > expiresAt) return res.status(400).json({ error: 'OTP has expired' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let assignedShopId = 1;
    let assignedShopSlug = 'default-shop';
    
    if (role === 'owner' && shop_name) {
      // Generate a basic slug
      let slug = shop_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (!slug) slug = 'shop-' + Date.now();
      
      // Ensure slug uniqueness
      let uniqueSlug = slug;
      let counter = 1;
      while (true) {
        const [[existing]] = await db.execute('SELECT id FROM shops WHERE slug = ?', [uniqueSlug]);
        if (!existing) break;
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      const [shopResult] = await db.execute('INSERT INTO shops (name, slug) VALUES (?, ?)', [shop_name, uniqueSlug]);
      assignedShopId = shopResult.insertId;
      assignedShopSlug = uniqueSlug;

      // Seed shop settings with registered shop name, phone and default UPI ID
      try {
        const defaultUpi = phone ? `${phone.replace(/\D/g, '')}@ybl` : 'farmerpay@upi';
        await db.execute(
          'INSERT INTO shop_settings (shop_id, setting_key, setting_value) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
          [assignedShopId, 'shop_name', shop_name, assignedShopId, 'shop_phone', phone || '', assignedShopId, 'upi_id', defaultUpi]
        );
      } catch (err) {
        console.error('Failed to seed default shop_settings:', err.message);
      }
    } else if (role !== 'owner' && shop_slug) {
      // Customer registering for a specific shop
      const [[shop]] = await db.execute('SELECT id, slug FROM shops WHERE slug = ?', [shop_slug]);
      if (shop) {
        assignedShopId = shop.id;
        assignedShopSlug = shop.slug;
      } else {
        return res.status(404).json({ error: 'Shop not found' });
      }
    }

    // Check if there is an existing farmer by phone first, then email
    let farmerId = null;
    if (phone) {
      const [[farmerByPhone]] = await db.execute('SELECT id FROM farmers WHERE phone = ? AND shop_id = ? LIMIT 1', [phone, assignedShopId]);
      if (farmerByPhone) farmerId = farmerByPhone.id;
    }
    
    if (!farmerId) {
      const [[farmerByEmail]] = await db.execute('SELECT id FROM farmers WHERE email = ? AND shop_id = ? LIMIT 1', [email, assignedShopId]);
      if (farmerByEmail) farmerId = farmerByEmail.id;
    }

    if (!farmerId && phone && role !== 'owner' && role !== 'admin') {
      // Create a new farmer if customer
      const [insertRes] = await db.execute(
        'INSERT INTO farmers (name, phone, email, shop_id, status) VALUES (?, ?, ?, ?, ?)',
        [username, phone, email, assignedShopId, 'active']
      );
      farmerId = insertRes.insertId;
    }

    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role, shop_id, farmer_id, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        username,
        email,
        hashedPassword,
        role !== undefined ? role : 'user',
        assignedShopId,
        farmerId,
        phone || null
      ]
    );

    // Delete OTP ONLY after successful registration
    await db.execute('DELETE FROM email_otps WHERE email = ?', [email]);

    const token = jwt.sign({ id: result.insertId, username, email, role: role || 'user', shop_id: assignedShopId, shop_name: shop_name || null, shop_slug: assignedShopSlug, farmer_id: farmerId, phone: phone || null }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
    res.json({ token, user: { id: result.insertId, username, email, phone: phone || null, role: role || 'user', shop_id: assignedShopId, shop_name: shop_name || null, shop_slug: assignedShopSlug, farmer_id: farmerId } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [[user]] = await db.execute(`
      SELECT u.id, u.username, u.email, u.phone, u.password, u.role, u.shop_id, u.farmer_id, s.name as shop_name, s.slug as shop_slug, f.current_credit, f.credit_limit, f.farm_size, f.crop_type
      FROM users u 
      LEFT JOIN shops s ON u.shop_id = s.id 
      LEFT JOIN farmers f ON u.farmer_id = f.id
      WHERE u.email = ?
    `, [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, phone: user.phone, role: user.role, shop_id: user.shop_id, shop_name: user.shop_name, shop_slug: user.shop_slug, farmer_id: user.farmer_id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, phone: user.phone, role: user.role, shop_id: user.shop_id, shop_name: user.shop_name, shop_slug: user.shop_slug, farmer_id: user.farmer_id, current_credit: user.current_credit, credit_limit: user.credit_limit, farm_size: user.farm_size, crop_type: user.crop_type } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public: Featured products for landing page
app.get('/api/products/featured', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, name, type, price, quantity, description, supplier
      FROM products
      WHERE quantity > 0
      ORDER BY quantity DESC, price DESC
      LIMIT 6
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get Primary/Latest Active Shop details for Landing page
app.get('/api/public/shop', async (req, res) => {
  try {
    // Look for registered custom shop (e.g. latest created owner shop or id 17)
    const [[shop]] = await db.execute(`
      SELECT s.id, s.name, s.slug, u.phone 
      FROM shops s 
      LEFT JOIN users u ON u.shop_id = s.id AND u.role = 'owner'
      WHERE s.id != 1 
      ORDER BY s.id DESC 
      LIMIT 1
    `);

    const targetShopId = shop ? shop.id : 1;
    const [rows] = await db.execute('SELECT setting_key, setting_value FROM shop_settings WHERE shop_id = ?', [targetShopId]);
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {});

    res.json({
      shop_id: targetShopId,
      shop_name: settings.shop_name || shop?.name || 'sri fertilizers',
      shop_phone: settings.shop_phone || shop?.phone || '+91 90143 97974',
      shop_address: settings.shop_address || 'Main Road, Market Yard, AP, India',
      shop_gstin: settings.shop_gstin || '09AAACK1234M1Z5',
      shop_slug: shop?.slug || 'sri-fertilizers'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products
app.get('/api/products', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products WHERE shop_id = ? ORDER BY name', [req.user.shop_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
app.get('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT * FROM products WHERE id = ? AND shop_id = ?', [req.params.id, req.user.shop_id || 1]);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new product
app.post('/api/products', verifyToken, async (req, res) => {
  const { name, type, price, quantity, supplier, description, batch_number, expiry_date } = req.body;

  if (!name || !type || !price) {
    return res.status(400).json({ error: 'Name, type, and price are required' });
  }

  try {
    const shopId = req.user.shop_id || 1;
    const [result] = await db.execute(
      'INSERT INTO products (name, type, price, quantity, supplier, description, batch_number, expiry_date, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        type,
        price,
        quantity || 0,
        supplier !== undefined ? supplier : null,
        description !== undefined ? description : null,
        batch_number !== undefined ? batch_number : null,
        expiry_date !== undefined ? expiry_date : null,
        shopId
      ]
    );

    // Auto-create supplier if specified
    if (supplier) {
      await ensureSupplierExists(supplier, shopId);
    }

    res.json({ id: result.insertId, message: 'Product added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk import products
app.post('/api/products/bulk', verifyToken, async (req, res) => {
  const { products } = req.body;
  
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'A valid array of products is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const shopId = req.user.shop_id || 1;
    let importedCount = 0;
    for (const prod of products) {
      if (!prod.name || !prod.price) continue; // Basic validation
      
      const type = prod.type || 'Other';
      const quantity = parseInt(prod.quantity) || 0;
      const supplierName = prod.supplier ? String(prod.supplier).trim() : null;
      
      await connection.execute(
        `INSERT INTO products (name, type, price, quantity, supplier, description, batch_number, expiry_date, shop_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           price = VALUES(price),
           quantity = quantity + VALUES(quantity),
           type = IF(VALUES(type) != 'Other', VALUES(type), type),
           supplier = COALESCE(VALUES(supplier), supplier),
           description = COALESCE(VALUES(description), description),
           batch_number = COALESCE(VALUES(batch_number), batch_number),
           expiry_date = COALESCE(VALUES(expiry_date), expiry_date)`,
        [
          prod.name,
          type,
          prod.price,
          quantity,
          supplierName || null,
          prod.description || null,
          prod.batch_number || null,
          prod.expiry_date || null,
          shopId
        ]
      );

      // Auto-create supplier directly so they appear in Purchase Management
      if (supplierName) {
        await ensureSupplierExists(supplierName, shopId, connection);
      }

      importedCount++;
    }

    await connection.commit();
    res.json({ message: `Successfully imported ${importedCount} products`, count: importedCount });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Update product
app.put('/api/products/:id', verifyToken, async (req, res) => {
  const { name, type, price, quantity, supplier, description, batch_number, expiry_date } = req.body;

  try {
    const shopId = req.user.shop_id || 1;
    const [result] = await db.execute(
      'UPDATE products SET name = ?, type = ?, price = ?, quantity = ?, supplier = ?, description = ?, batch_number = ?, expiry_date = ? WHERE id = ? AND shop_id = ?',
      [
        name,
        type,
        price,
        quantity !== undefined ? quantity : 0,
        supplier !== undefined ? supplier : null,
        description !== undefined ? description : null,
        batch_number !== undefined ? batch_number : null,
        expiry_date !== undefined ? expiry_date : null,
        req.params.id,
        shopId
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });

    // Auto-create supplier if updated to a new supplier
    if (supplier) {
      await ensureSupplierExists(supplier, shopId);
    }

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM products WHERE id = ? AND shop_id = ?', [req.params.id, req.user.shop_id || 1]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found or unauthorized' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        error: 'Cannot delete product because it has associated sales, orders, or compatibility rules. Try updating its quantity to 0 instead.'
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get all sales
app.get('/api/sales', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT s.*,
             GROUP_CONCAT(CONCAT(p.name, ' (x', si.quantity, ')') SEPARATOR ', ') as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.shop_id = ?
      GROUP BY s.id
      ORDER BY s.sale_date DESC
    `, [req.user.shop_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single sale with items
app.get('/api/sales/:id', verifyToken, async (req, res) => {
  try {
    const [[sale]] = await db.execute('SELECT * FROM sales WHERE id = ? AND shop_id = ?', [req.params.id, req.user.shop_id || 1]);
    if (!sale) return res.status(404).json({ error: 'Sale not found or unauthorized' });

    const [items] = await db.execute(`
      SELECT si.*, p.name, p.type, p.batch_number, p.expiry_date, p.description
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
  const { customer_name, customer_phone, items, total_amount, payment_status, payment_method } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Sale must have at least one item' });
  }

  const isCredit = payment_status === 'Pay Later / Credit' || payment_status === 'Credit' || (typeof payment_status === 'string' && payment_status.includes('Credit'));

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let saleFarmerId = null;
    let finalCustomerName = customer_name;

    if (customer_phone || customer_name) {
      // 1. Try to find existing farmer by phone
      if (customer_phone) {
        const query = isCredit 
          ? 'SELECT id, name FROM farmers WHERE phone = ? AND shop_id = ? LIMIT 1 FOR UPDATE'
          : 'SELECT id, name FROM farmers WHERE phone = ? AND shop_id = ? LIMIT 1';
        
        const [[existing]] = await connection.execute(query, [customer_phone, req.user.shop_id || 1]);
        if (existing) {
          saleFarmerId = existing.id;
          if (!finalCustomerName) finalCustomerName = existing.name;
        }
      }

      // 2. If not found by phone, try by exact name match
      if (!saleFarmerId && finalCustomerName) {
        const [[existing]] = await connection.execute(
          'SELECT id FROM farmers WHERE name = ? AND shop_id = ? LIMIT 1', 
          [finalCustomerName, req.user.shop_id || 1]
        );
        if (existing) {
          saleFarmerId = existing.id;
        }
      }

      // 2b. If still not found and phone is provided, check if farmer exists globally
      if (!saleFarmerId && customer_phone) {
        const [[globalExisting]] = await connection.execute(
          'SELECT id, name FROM farmers WHERE phone = ? LIMIT 1',
          [customer_phone]
        );
        if (globalExisting) {
          saleFarmerId = globalExisting.id;
          if (!finalCustomerName) finalCustomerName = globalExisting.name;
        }
      }

      // 3. If still not found, auto-create a new farmer record
      if (!saleFarmerId && finalCustomerName) {
        const [insertRes] = await connection.execute(
          'INSERT INTO farmers (name, phone, shop_id, status) VALUES (?, ?, ?, ?)',
          [finalCustomerName, customer_phone || null, req.user.shop_id || 1, 'active']
        );
        saleFarmerId = insertRes.insertId;
      }
    }

    if (isCredit) {
      if (!saleFarmerId) {
        throw new Error('A customer must be identified or created to allow Pay Later / Credit');
      }
      const [[farmer]] = await connection.execute(
        'SELECT current_credit, credit_limit FROM farmers WHERE id = ? FOR UPDATE',
        [saleFarmerId]
      );
      
      const availableCredit = parseFloat(farmer.credit_limit) - parseFloat(farmer.current_credit);
      if (parseFloat(farmer.credit_limit) > 0 && availableCredit < total_amount) {
        throw new Error(`Insufficient available credit. Available Credit: ₹${availableCredit.toFixed(2)}, Requested Credit: ₹${total_amount}`);
      }
      
      await connection.execute('UPDATE farmers SET current_credit = current_credit + ? WHERE id = ?', [total_amount, saleFarmerId]);
      
      await connection.execute(
        `INSERT INTO farmer_interest_transactions 
         (farmer_id, transaction_type, amount, principal_amount, interest_amount, reference_id, performed_by) 
         VALUES (?, 'CREDIT_PURCHASE', ?, ?, 0, ?, ?)`,
        [saleFarmerId, total_amount, total_amount, 'Walk-in Sale', req.user.id]
      );
    }

    const [saleResult] = await connection.execute(
      'INSERT INTO sales (farmer_id, customer_name, customer_phone, total_amount, payment_method, shop_id, sale_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        saleFarmerId,
        finalCustomerName !== undefined ? finalCustomerName : null,
        customer_phone !== undefined ? customer_phone : null,
        total_amount,
        isCredit ? 'Credit' : (payment_method || 'Cash'),
        req.user.shop_id || 1,
        'walk-in'
      ]
    );
    const saleId = saleResult.insertId;

    for (const item of items) {
      await connection.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)',
        [saleId, item.product_id, item.quantity, item.price_per_unit, item.total_price]
      );
      await connection.execute(
        'UPDATE products SET quantity = quantity - ? WHERE id = ? AND shop_id = ?',
        [item.quantity, item.product_id, req.user.shop_id || 1]
      );
    }

    if (!isCredit) {
      // Add to payments as income ONLY if it's paid now
      await connection.execute(
        'INSERT INTO payments (sale_id, amount, payment_method, payment_type, notes, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, total_amount, payment_method || 'Cash', 'income', `Sale to ${customer_name || 'Customer'}`, req.user.shop_id || 1]
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

// Delete sale
app.delete('/api/sales/:id', verifyToken, async (req, res) => {
  const saleId = req.params.id;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get sale and its items
    const [[sale]] = await connection.execute('SELECT * FROM sales WHERE id = ? AND shop_id = ?', [saleId, req.user.shop_id || 1]);
    if (!sale) {
      await connection.rollback();
      return res.status(404).json({ error: 'Sale not found or unauthorized' });
    }

    const [items] = await connection.execute('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

    // Restore product quantities
    for (const item of items) {
      await connection.execute(
        'UPDATE products SET quantity = quantity + ? WHERE id = ? AND shop_id = ?',
        [item.quantity, item.product_id, req.user.shop_id || 1]
      );
    }

    // Delete sale items
    await connection.execute('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);

    // Delete associated payments
    await connection.execute('DELETE FROM payments WHERE sale_id = ?', [saleId]);

    // Delete sale
    await connection.execute('DELETE FROM sales WHERE id = ?', [saleId]);

    await connection.commit();
    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});
// ── User Profile Endpoints ───────────────────────────────────────────────

app.get('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, u.username, u.email, u.role, u.shop_id, u.farmer_id,
        f.phone, f.location, f.farm_size, f.crop_type, f.soil_type,
        f.credit_limit, f.current_credit, f.interest_rate, f.accrued_interest
      FROM users u
      LEFT JOIN farmers f ON u.farmer_id = f.id
      WHERE u.id = ?
    `;
    const [[user]] = await db.execute(query, [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = { ...user };
    
    if (user.farmer_id) {
      profile.available_credit = (profile.credit_limit || 0) - (profile.current_credit || 0);
      profile.total_payable = parseFloat(profile.current_credit || 0) + parseFloat(profile.accrued_interest || 0);
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/profile', verifyToken, async (req, res) => {
  const { name, phone, email, location, farm_size, crop_type, soil_type } = req.body;
  const safePhone = phone && String(phone).trim() !== '' ? String(phone).trim() : null;
  const safeEmail = email && String(email).trim() !== '' ? String(email).trim() : null;
  const safeLocation = location && String(location).trim() !== '' ? String(location).trim() : null;
  const safeFarmSize = farm_size && String(farm_size).trim() !== '' ? String(farm_size).trim() : null;
  const safeCropType = crop_type && String(crop_type).trim() !== '' ? String(crop_type).trim() : null;
  const safeSoilType = soil_type && String(soil_type).trim() !== '' ? String(soil_type).trim() : null;
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Update User info
    await connection.execute(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [name, safeEmail, req.user.id]
    );

    const [[user]] = await connection.execute('SELECT farmer_id FROM users WHERE id = ?', [req.user.id]);
    
    if (user.farmer_id) {
      // 2a. Update existing farmer
      // Check phone uniqueness against other farmers
      const [[existingPhone]] = await connection.execute('SELECT id FROM farmers WHERE phone = ? AND phone IS NOT NULL AND id != ?', [safePhone, user.farmer_id]);
      if (existingPhone) {
        throw new Error('This phone number is already associated with another farmer.');
      }
      
      await connection.execute(
        'UPDATE farmers SET name = ?, phone = ?, email = ?, location = ?, farm_size = ?, crop_type = ?, soil_type = ? WHERE id = ?',
        [name, safePhone, safeEmail, safeLocation, safeFarmSize, safeCropType, safeSoilType, user.farmer_id]
      );
    } else {
      // 2b. Only create/link if farmer fields are provided to prevent unnecessary CRM records
      if (safePhone || safeLocation || safeFarmSize || safeCropType || safeSoilType) {
        let targetFarmerId = null;
        
        const [[farmerByPhone]] = safePhone ? await connection.execute('SELECT id FROM farmers WHERE phone = ? LIMIT 1', [safePhone]) : [[]];
        if (farmerByPhone) {
          targetFarmerId = farmerByPhone.id;
        } else {
          const [[farmerByEmail]] = safeEmail ? await connection.execute('SELECT id FROM farmers WHERE email = ? LIMIT 1', [safeEmail]) : [[]];
          if (farmerByEmail) {
            targetFarmerId = farmerByEmail.id;
          }
        }

        if (targetFarmerId) {
          // Check phone uniqueness before updating
          if (safePhone) {
            const [[existingPhone]] = await connection.execute('SELECT id FROM farmers WHERE phone = ? AND phone IS NOT NULL AND id != ?', [safePhone, targetFarmerId]);
            if (existingPhone) {
              throw new Error('This phone number is already associated with another farmer.');
            }
          }

          // Link to existing farmer
          await connection.execute('UPDATE users SET farmer_id = ? WHERE id = ?', [targetFarmerId, req.user.id]);
          
          // Update their details
          await connection.execute(
            'UPDATE farmers SET name = ?, phone = ?, email = ?, location = ?, farm_size = ?, crop_type = ?, soil_type = ? WHERE id = ?',
            [name, safePhone, safeEmail, safeLocation, safeFarmSize, safeCropType, safeSoilType, targetFarmerId]
          );
        } else {
          // Create new farmer
          const [result] = await connection.execute(
            'INSERT INTO farmers (name, phone, email, location, farm_size, crop_type, soil_type, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, safePhone, safeEmail, safeLocation, safeFarmSize, safeCropType, safeSoilType, req.user.shop_id || 1]
          );
          targetFarmerId = result.insertId;
          await connection.execute('UPDATE users SET farmer_id = ? WHERE id = ?', [targetFarmerId, req.user.id]);
        }
      }
    }

    await connection.commit();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// ── Farmer Management Endpoints ────────────────────────────────────────────

// Get all farmers (admin/owner only)
app.get('/api/farmers', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const salesHasFarmerId = await columnExists('sales', 'farmer_id');

    // Auto-sync online customers into the farmers CRM table
    // Using CONCAT('N/A-', u.id) to avoid UNIQUE constraint violation on 'phone' since it's NOT NULL UNIQUE
    await db.execute(`
      INSERT INTO farmers (name, email, phone, status, shop_id)
      SELECT DISTINCT 
        u.username as name, 
        u.email, 
        CONCAT('N/A-', u.id) as phone, 
        'active' as status,
        u.shop_id
      FROM users u 
      JOIN orders o ON u.id = o.user_id
      WHERE u.email IS NOT NULL 
      AND u.email != ''
      AND u.shop_id = ?
      AND u.email NOT IN (SELECT email FROM farmers WHERE email IS NOT NULL AND email != '' AND shop_id = ?)
    `, [req.user.shop_id || 1, req.user.shop_id || 1]);

    const [rows] = salesHasFarmerId
      ? await db.execute(`
          SELECT 
            f.*, 
            (COUNT(DISTINCT s.id) + COALESCE(
              (SELECT COUNT(DISTINCT o.id) FROM orders o JOIN users u ON o.user_id = u.id WHERE u.email = f.email)
            , 0)) as total_purchases,
            (COALESCE(SUM(s.total_amount), 0) + COALESCE(
              (SELECT SUM(o.total_amount) FROM orders o JOIN users u ON o.user_id = u.id WHERE u.email = f.email)
            , 0)) as total_spent,
            GREATEST(
              COALESCE(MAX(s.sale_date), '1000-01-01'), 
              COALESCE((SELECT MAX(o.created_at) FROM orders o JOIN users u ON o.user_id = u.id WHERE u.email = f.email), '1000-01-01')
            ) as last_purchase_date
          FROM farmers f
          LEFT JOIN sales s ON f.id = s.farmer_id
          WHERE f.shop_id = ?
          GROUP BY f.id
          ORDER BY f.name ASC
        `, [req.user.shop_id || 1])
      : await db.execute(`
          SELECT 
            f.*, 
            COALESCE((SELECT COUNT(DISTINCT o.id) FROM orders o JOIN users u ON o.user_id = u.id WHERE u.email = f.email), 0) as total_purchases,
            COALESCE((SELECT SUM(o.total_amount) FROM orders o JOIN users u ON o.user_id = u.id WHERE u.email = f.email), 0) as total_spent,
            COALESCE((SELECT MAX(o.created_at) FROM orders o JOIN users u ON o.user_id = u.id WHERE u.email = f.email), NULL) as last_purchase_date
          FROM farmers f
          WHERE f.shop_id = ?
          ORDER BY f.name ASC
        `, [req.user.shop_id || 1]);

    // Clean up dummy GREATEST fallback dates if no purchases exist
    const processedRows = rows.map(row => {
      if (row.last_purchase_date && row.last_purchase_date.toString().includes('1000')) {
        row.last_purchase_date = null;
      }
      return row;
    });

    res.json(processedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single farmer
app.get('/api/farmers/:id', verifyToken, async (req, res) => {
  try {
    const salesHasFarmerId = await columnExists('sales', 'farmer_id');

    const [[farmer]] = await db.execute('SELECT * FROM farmers WHERE id = ? AND shop_id = ?', [req.params.id, req.user.shop_id || 1]);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found or unauthorized' });
    
    // Get farmer's in-store/walk-in sales history only (exclude online orders which are displayed separately)
    const [sales] = salesHasFarmerId
      ? await db.execute(`
          SELECT s.*, GROUP_CONCAT(CONCAT(p.name, ' (x', si.quantity, ')') SEPARATOR ', ') as items
          FROM sales s
          LEFT JOIN sale_items si ON s.id = si.sale_id
          LEFT JOIN products p ON si.product_id = p.id
          WHERE s.farmer_id = ? AND (s.sale_type IS NULL OR s.sale_type != 'online')
          GROUP BY s.id
          ORDER BY s.sale_date DESC
        `, [req.params.id])
      : [[]];

    // Get farmer's online orders by matching email
    let onlineOrders = [];
    if (farmer.email) {
      const [oRows] = await db.execute(`
        SELECT 
          o.*,
          u.username as customer_name,
          GROUP_CONCAT(CONCAT(oi.product_name, ' (x', oi.quantity, ')') SEPARATOR ', ') as items
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE u.email = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `, [farmer.email]);
      onlineOrders = oRows;
    }
    
    res.json({ ...farmer, sales, onlineOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create farmer
app.post('/api/farmers', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { name, phone, email, location, farm_size, crop_type, credit_limit } = req.body;
  
  const safePhone = phone ? phone.trim() : null;
  const safeEmail = email ? email.trim() : null;

  if (!name || !safePhone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO farmers (name, phone, email, location, farm_size, crop_type, credit_limit, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, safePhone, safeEmail, location || null, farm_size || null, crop_type || null, credit_limit || 0, req.user.shop_id || 1]
    );
    res.status(201).json({ id: result.insertId, message: 'Farmer added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('phone')) {
        return res.status(400).json({ error: 'This phone number is already registered to another farmer.' });
      }
      if (err.message.includes('email')) {
        return res.status(400).json({ error: 'This email is already registered to another farmer.' });
      }
      return res.status(400).json({ error: 'A duplicate entry already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update farmer
app.put('/api/farmers/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { name, phone, email, location, farm_size, crop_type, credit_limit, status } = req.body;
  const safePhone = phone ? phone.trim() : null;
  const safeEmail = email ? email.trim() : null;

  try {
    const [result] = await db.execute(
      `UPDATE farmers SET name = ?, phone = ?, email = ?, location = ?, farm_size = ?, crop_type = ?, credit_limit = ?, status = ? WHERE id = ? AND shop_id = ?`,
      [name, safePhone, safeEmail, location || null, farm_size || null, crop_type || null, credit_limit || 0, status || 'active', req.params.id, req.user.shop_id || 1]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Farmer not found' });
    res.json({ message: 'Farmer updated successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('phone')) {
        return res.status(400).json({ error: 'This phone number is already registered to another farmer.' });
      }
      if (err.message.includes('email')) {
        return res.status(400).json({ error: 'This email is already registered to another farmer.' });
      }
      return res.status(400).json({ error: 'A duplicate entry already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete farmer
app.delete('/api/farmers/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const salesHasFarmerId = await columnExists('sales', 'farmer_id');
    const purchaseCount = salesHasFarmerId
      ? (await db.execute('SELECT COUNT(*) as count FROM sales WHERE farmer_id = ?', [req.params.id]))[0][0].count
      : 0;
    if (purchaseCount > 0) {
      return res.status(400).json({ error: 'Cannot delete farmer with purchase history' });
    }
    
    const [result] = await db.execute('DELETE FROM farmers WHERE id = ? AND shop_id = ?', [req.params.id, req.user.shop_id || 1]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Farmer not found' });
    res.json({ message: 'Farmer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Farmer Interest & Credit Endpoints ─────────────────────────────────────

// Update interest rate
app.put('/api/farmers/:id/interest-rate', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { interest_rate } = req.body;
  if (interest_rate === undefined || isNaN(interest_rate) || interest_rate < 0) {
    return res.status(400).json({ error: 'Valid interest rate is required' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE farmers SET interest_rate = ? WHERE id = ? AND shop_id = ?',
      [interest_rate, req.params.id, req.user.shop_id || 1]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Farmer not found' });
    res.json({ message: 'Interest rate updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate monthly interest
app.post('/api/farmers/:id/calculate-interest', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { calculation_period } = req.body; // e.g. "2026-08"
  if (!calculation_period) {
    return res.status(400).json({ error: 'calculation_period is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if already calculated for this period
    const [[existing]] = await connection.execute(
      'SELECT id FROM farmer_interest_transactions WHERE farmer_id = ? AND transaction_type = "ACCRUAL" AND calculation_period = ?',
      [req.params.id, calculation_period]
    );
    if (existing) {
      throw new Error('Interest for this period has already been calculated.');
    }

    const [[farmer]] = await connection.execute(
      'SELECT current_credit, interest_rate FROM farmers WHERE id = ? AND shop_id = ?',
      [req.params.id, req.user.shop_id || 1]
    );

    if (!farmer) {
      throw new Error('Farmer not found');
    }

    if (parseFloat(farmer.current_credit) <= 0 || parseFloat(farmer.interest_rate) <= 0) {
      await connection.rollback();
      return res.json({ message: 'No interest to calculate (balance is 0 or rate is 0)', interestAmount: 0 });
    }

    const interestAmount = (parseFloat(farmer.current_credit) * parseFloat(farmer.interest_rate)) / 100;

    await connection.execute(
      'UPDATE farmers SET accrued_interest = accrued_interest + ? WHERE id = ?',
      [interestAmount, req.params.id]
    );

    await connection.execute(
      `INSERT INTO farmer_interest_transactions 
       (farmer_id, transaction_type, amount, principal_amount, interest_amount, interest_rate, calculation_period, performed_by) 
       VALUES (?, 'ACCRUAL', ?, 0, ?, ?, ?, ?)`,
      [req.params.id, interestAmount, interestAmount, farmer.interest_rate, calculation_period, req.user.id]
    );

    await connection.commit();
    res.json({ message: 'Monthly interest calculated successfully', interestAmount });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Waive interest
app.post('/api/farmers/:id/waive-interest', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { amount, reason } = req.body;
  if (!amount || amount <= 0 || !reason) {
    return res.status(400).json({ error: 'Valid amount and reason are required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [[farmer]] = await connection.execute(
      'SELECT accrued_interest FROM farmers WHERE id = ? AND shop_id = ? FOR UPDATE',
      [req.params.id, req.user.shop_id || 1]
    );

    if (!farmer) {
      throw new Error('Farmer not found');
    }

    if (parseFloat(amount) > parseFloat(farmer.accrued_interest)) {
      throw new Error('Cannot waive more than the accrued interest');
    }

    await connection.execute(
      'UPDATE farmers SET accrued_interest = accrued_interest - ? WHERE id = ?',
      [amount, req.params.id]
    );

    await connection.execute(
      `INSERT INTO farmer_interest_transactions 
       (farmer_id, transaction_type, amount, interest_amount, reason, performed_by) 
       VALUES (?, 'WAIVER', ?, ?, ?, ?)`,
      [req.params.id, amount, amount, reason, req.user.id]
    );

    await connection.commit();
    res.json({ message: 'Interest waived successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Record credit payment
app.post('/api/farmers/:id/payment', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { amount, payment_method } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [[farmer]] = await connection.execute(
      'SELECT current_credit, accrued_interest FROM farmers WHERE id = ? AND shop_id = ? FOR UPDATE',
      [req.params.id, req.user.shop_id || 1]
    );

    if (!farmer) throw new Error('Farmer not found');

    const currentCredit = parseFloat(farmer.current_credit);
    const accruedInterest = parseFloat(farmer.accrued_interest);
    const totalPayable = currentCredit + accruedInterest;
    let paymentAmount = parseFloat(amount);

    if (paymentAmount > totalPayable) {
      throw new Error('Payment cannot exceed total payable amount');
    }

    let interestPaid = 0;
    let principalPaid = 0;

    if (paymentAmount <= accruedInterest) {
      interestPaid = paymentAmount;
    } else {
      interestPaid = accruedInterest;
      principalPaid = paymentAmount - accruedInterest;
    }

    await connection.execute(
      'UPDATE farmers SET accrued_interest = accrued_interest - ?, current_credit = current_credit - ? WHERE id = ?',
      [interestPaid, principalPaid, req.params.id]
    );

    await connection.execute(
      `INSERT INTO farmer_interest_transactions 
       (farmer_id, transaction_type, amount, principal_amount, interest_amount, performed_by) 
       VALUES (?, 'PAYMENT', ?, ?, ?, ?)`,
      [req.params.id, paymentAmount, principalPaid, interestPaid, req.user.id]
    );

    await connection.execute(
      'INSERT INTO payments (sale_id, amount, payment_method, payment_type, notes, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
      [null, paymentAmount, payment_method || 'Cash', 'income', `Credit repayment from farmer ${req.params.id}`, req.user.shop_id || 1]
    );

    await connection.commit();
    res.json({ 
      message: 'Payment recorded successfully',
      interestPaid,
      principalPaid
    });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Get credit history
app.get('/api/farmers/:id/credit-history', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const [history] = await db.execute(`
      SELECT fit.*, u.username as performed_by_name 
      FROM farmer_interest_transactions fit
      LEFT JOIN users u ON fit.performed_by = u.id
      WHERE fit.farmer_id = ?
      ORDER BY fit.transaction_date DESC, fit.id DESC
    `, [req.params.id]);
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get inventory report
app.get('/api/reports/inventory', verifyToken, async (req, res) => {
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
      WHERE shop_id = ?
      ORDER BY quantity ASC
    `, [req.user.shop_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sales report
app.get('/api/reports/sales', verifyToken, async (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `
    SELECT
      DATE(sale_date) as date,
      COUNT(*) as total_sales,
      SUM(total_amount) as total_revenue
    FROM sales
    WHERE shop_id = ?
  `;

  const params = [req.user.shop_id || 1];
  if (start_date && end_date) {
    query += ' AND DATE(sale_date) BETWEEN ? AND ?';
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

// ── Automated Monthly WhatsApp Debt Reminders ──────────────────────────────

function buildReminderMessage({ farmerName, totalDue, shopName, upiId, shopPhone, lang = 'te', urgency = 'gentle' }) {
  const upiPart = upiId ? `\n💳 Pay via UPI ID: ${upiId}` : '';
  const phonePart = shopPhone ? `\n📞 Helpline: ${shopPhone}` : '';
  const due = parseFloat(totalDue || 0).toFixed(2);

  if (lang === 'te') {
    if (urgency === 'urgent') {
      return `⚠️ ముఖ్యమైన చెల్లింపు సమాచారం\n\nప్రియమైన ${farmerName} గారు,\n${shopName} వద్ద మీ వ్యవసాయ ఖాతా బాకీ బిల్లు ₹${due} ఇంకా పెండింగ్‌లో ఉంది.\n\nవచ్చే పంట సీజన్‌లో ఎరువులు మరియు విత్తనాల సదుపాయం నిరంతరాయంగా కొనసాగడానికి దయచేసి బాకీని వెంటనే చెల్లించవలసిందిగా మనవి.${upiPart}${phonePart}\n\nధన్యవాదాలు.`;
    }
    return `నమస్కారం ${farmerName} గారు, 🙏\n\nఇది ${shopName} నుండి నెలవారీ ఖాతా బాకీ రిమైండర్. మీ ఎరువులు మరియు విత్తనాల ఖాతాలో మొత్తం బాకీ బిల్లు ₹${due} ఉంది.\n\nదయచేసి మీ వీలును బట్టి త్వరగా చెల్లించవలసిందిగా కోరుతున్నాము.${upiPart}${phonePart}\n\nధన్యవాదాలు మరియు శుభ వ్యవసాయం! 🌱`;
  } else if (lang === 'hi') {
    if (urgency === 'urgent') {
      return `⚠️ आवश्यक भुगतान सूचना\n\nप्रिय ${farmerName} जी,\n${shopName} पर आपके कृषि खाते का बकाया बिल ₹${due} लंबित है।\n\nकृपया आगामी सीजन की खाद/बीज आपूर्ति एवं क्रेडिट जारी रखने हेतु जल्द भुगतान करें।${upiPart}${phonePart}\n\nधन्यवाद।`;
    }
    return `नमस्ते ${farmerName} जी, 🙏\n\nयह ${shopName} की तरफ से मासिक खाता बकाया अनुस्मारक है। आपके खाद एवं बीज खाते का कुल बकाया बिल ₹${due} है।\n\nकृपया सुविधानुसार जल्द से जल्द भुगतान करने का कष्ट करें।${upiPart}${phonePart}\n\nधन्यवाद एवं शुभ कृषि! 🌱`;
  } else if (lang === 'ta') {
    if (urgency === 'urgent') {
      return `⚠️ முக்கியமான நிலுவை அறிவிப்பு\n\nஅன்புள்ள ${farmerName} அவர்களே,\n${shopName} கடையில் உங்கள் விவசாய கணக்கு நிலுவை ₹${due} நீண்ட நாட்களாக நிலுவையில் உள்ளது.\n\nஅடுத்த பருவத்திற்கான உரம் மற்றும் கடன் தொடர தயவுசெய்து உடனே தொகையை செலுத்தவும்.${upiPart}${phonePart}\n\nநன்றி.`;
    }
    return `வணக்கம் ${farmerName} அவர்களே, 🙏\n\nஇது ${shopName} நிறுவனத்தின் மாதந்திர நிலுவைத் தொகை நினைவூட்டல். உங்கள் உரம் மற்றும் விதை கணக்கில் நிலுவை ₹${due} உள்ளது.\n\nதயவுசெய்து உங்கள் வசதிக்கேற்ப நிலுவையை விரைவில் செலுத்துமாறு கேட்டுக்கொள்கிறோம்.${upiPart}${phonePart}\n\nநன்றி & நல்விவசாயம்! 🌱`;
  } else if (lang === 'kn') {
    if (urgency === 'urgent') {
      return `⚠️ ಮುಖ್ಯ ಬಾಕಿ ಪಾವತಿ ಸೂಚನೆ\n\nಆತ್ಮೀಯ ${farmerName} ಅವರೇ,\n${shopName} ನಲ್ಲಿ ನಿಮ್ಮ ಕೃಷಿ ಖಾತೆಯ ಬಾಕಿ ಬಿಲ್ ₹${due} ಇನ್ನೂ ಬಾಕಿ ಉಳಿದಿದೆ.\n\nಮುಂದಿನ ಕೃಷಿ ಸೀಸನ್‌ನಲ್ಲಿ ಸೌಲಭ್ಯ ನಿರಂತರವಾಗಿರಲು ದಯವಿಟ್ಟು ಬಾಕಿಯನ್ನು ಶೀಘ್ರವೇ ಪಾವತಿಸಿ.${upiPart}${phonePart}\n\nಧನ್ಯವಾದಗಳು.`;
    }
    return `ನಮಸ್ಕಾರ ${farmerName} ಅವರೇ, 🙏\n\nಇದು ${shopName} ವತಿಯಿಂದ ಮಾಸಿಕ ಪಾವತಿ ಜ್ಞಾಪನೆ. ನಿಮ್ಮ ರಸಗೊಬ್ಬರ ಮತ್ತು ಬೀಜಗಳ ಖಾತೆಯಲ್ಲಿ ಒಟ್ಟು ಬಾಕಿ ₹${due} ಇದೆ.\n\nದಯವಿಟ್ಟು ನಿಮ್ಮ ಅನುಕೂಲಕ್ಕೆ ತಕ್ಕಂತೆ ಶೀಘ್ರವೇ ಪಾವತಿಸಲು ವಿನಂತಿ.${upiPart}${phonePart}\n\nಧನ್ಯವಾದಗಳು & ಹರ್ಷದ ಕೃಷಿ! 🌱`;
  } else if (lang === 'mr') {
    if (urgency === 'urgent') {
      return `⚠️ महत्त्वाची बाकी देयक सूचना\n\nप्रिय ${farmerName} जी,\n${shopName} कडे आपल्या कृषी खात्याचे बाकी बिल ₹${due} प्रलंबित आहे.\n\nपुढील हंगामात खत आणि पतपुरवठा अखंड सुरू ठेवण्यासाठी कृपया तातडीने देयक पूर्ण करावे.${upiPart}${phonePart}\n\nधन्यवाद.`;
    }
    return `नमस्कार ${farmerName} जी, 🙏\n\nहे ${shopName} कडून एक मासिक देयक स्मरणपत्र आहे. आपल्या खते व बियाणे खात्यावरील एकूण बाकी बिल ₹${due} आहे.\n\nकृपया आपल्या सोयीनुसार लवकरात लवकर रक्कम भरावी.${upiPart}${phonePart}\n\nधन्यवाद व समृद्ध शेती! 🌱`;
  } else {
    // English
    if (urgency === 'urgent') {
      return `⚠️ MONTHLY PAYMENT NOTICE\n\nDear ${farmerName} ji,\nThis is to notify that your fertilizer account balance of ₹${due} at ${shopName} is currently pending clearance.\n\nPlease settle the dues at your earliest convenience to maintain continuous seasonal credit.${upiPart}${phonePart}\n\nThank you.`;
    }
    return `Hello ${farmerName} ji, 🙏\n\nThis is a gentle monthly payment reminder from ${shopName}. Your outstanding fertilizer bill balance is ₹${due}.\n\nKindly clear the pending payment at your convenience.${upiPart}${phonePart}\n\nThank you & happy farming! 🌱`;
  }
}

async function generateMonthlyRemindersForShop(shopId, targetPeriod, overrides = {}) {
  const [settingsRows] = await db.execute('SELECT setting_key, setting_value FROM shop_settings WHERE shop_id = ?', [shopId]);
  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {});

  const minAmount = parseFloat(overrides.min_amount !== undefined ? overrides.min_amount : (settings.auto_reminder_min_amount || '100'));
  const defaultLang = overrides.language || settings.auto_reminder_default_lang || 'te';
  const urgency = overrides.urgency || settings.auto_reminder_urgency || 'gentle';
  const shopName = settings.shop_name || 'Agro & Fertilizer Center';
  const upiId = settings.upi_id || '';
  const shopPhone = settings.shop_phone || '';

  const [farmers] = await db.execute(`
    SELECT id, name, phone, current_credit, accrued_interest,
           (COALESCE(current_credit, 0) + COALESCE(accrued_interest, 0)) as total_due
    FROM farmers
    WHERE shop_id = ? AND status = 'active'
      AND (COALESCE(current_credit, 0) + COALESCE(accrued_interest, 0)) >= ?
  `, [shopId, minAmount]);

  let createdCount = 0;
  let updatedCount = 0;

  for (const farmer of farmers) {
    const totalDue = parseFloat(farmer.total_due || 0);
    const principal = parseFloat(farmer.current_credit || 0);
    const interest = parseFloat(farmer.accrued_interest || 0);

    const message = buildReminderMessage({
      farmerName: farmer.name,
      totalDue,
      shopName,
      upiId,
      shopPhone,
      lang: defaultLang,
      urgency
    });

    const [existing] = await db.execute(`
      SELECT id, status FROM credit_reminders
      WHERE shop_id = ? AND farmer_id = ? AND month_period = ?
      LIMIT 1
    `, [shopId, farmer.id, targetPeriod]);

    if (existing.length > 0) {
      if (existing[0].status !== 'sent') {
        await db.execute(`
          UPDATE credit_reminders
          SET amount = ?, principal_amount = ?, interest_amount = ?, message_text = ?, language = ?
          WHERE id = ?
        `, [totalDue, principal, interest, message, defaultLang, existing[0].id]);
        updatedCount++;
      }
    } else {
      await db.execute(`
        INSERT INTO credit_reminders
        (shop_id, farmer_id, customer_name, phone, amount, principal_amount, interest_amount, due_date, status, reminder_type, month_period, language, message_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'due', 'automated_monthly', ?, ?, ?)
      `, [shopId, farmer.id, farmer.name, farmer.phone, totalDue, principal, interest, targetPeriod, defaultLang, message]);
      createdCount++;
    }
  }

  return { createdCount, updatedCount, totalProcessed: farmers.length, period: targetPeriod };
}

async function runScheduledMonthlyReminders() {
  if (!db) return;
  try {
    const now = new Date();
    const currentDay = now.getDate();
    const currentPeriod = now.toISOString().slice(0, 7);

    const [shops] = await db.execute('SELECT id FROM shops');
    for (const shop of shops) {
      const [settingsRows] = await db.execute('SELECT setting_key, setting_value FROM shop_settings WHERE shop_id = ?', [shop.id]);
      const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {});

      const isEnabled = settings.auto_reminder_enabled !== 'false';
      const scheduledDay = parseInt(settings.auto_reminder_day || '1', 10);

      if (isEnabled && currentDay >= scheduledDay) {
        const [[check]] = await db.execute(
          'SELECT COUNT(*) as count FROM credit_reminders WHERE shop_id = ? AND month_period = ?',
          [shop.id, currentPeriod]
        );
        if (check.count === 0) {
          console.log(`[AutoReminderScheduler] Auto-generating monthly reminders for shop ${shop.id} (${currentPeriod})...`);
          await generateMonthlyRemindersForShop(shop.id, currentPeriod, settings);
        }
      }
    }
  } catch (err) {
    console.error('[AutoReminderScheduler] Error:', err.message);
  }
}

function initAutoReminderScheduler() {
  setTimeout(runScheduledMonthlyReminders, 5000);
  setInterval(runScheduledMonthlyReminders, 4 * 60 * 60 * 1000);
}

// Credit Reminders API
app.get('/api/credit-reminders', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const shopId = req.user.shop_id || 1;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const period = req.query.period || currentMonth;
  const status = req.query.status;

  try {
    let query = `
      SELECT cr.*, 
             f.name as farmer_name, 
             COALESCE(cr.phone, f.phone) as farmer_phone,
             f.current_credit as current_principal, 
             f.accrued_interest as current_accrued_interest,
             (COALESCE(f.current_credit, 0) + COALESCE(f.accrued_interest, 0)) as live_total_due
      FROM credit_reminders cr
      LEFT JOIN farmers f ON cr.farmer_id = f.id
      WHERE cr.shop_id = ?
    `;
    const params = [shopId];

    if (period && period !== 'all') {
      query += ' AND cr.month_period = ?';
      params.push(period);
    }

    if (status && status !== 'all') {
      query += ' AND cr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY cr.created_at DESC, cr.amount DESC';

    const [rows] = await db.execute(query, params);

    const totalDue = rows.filter(r => r.status !== 'dismissed').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const pendingCount = rows.filter(r => r.status === 'due' || r.status === 'overdue').length;
    const sentCount = rows.filter(r => r.status === 'sent').length;

    res.json({
      reminders: rows,
      summary: {
        totalDue,
        pendingCount,
        sentCount,
        totalCount: rows.length,
        period
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credit-reminders/generate-monthly', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const shopId = req.user.shop_id || 1;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const targetPeriod = req.body.month_period || currentMonth;
  const { min_amount, language, urgency } = req.body;

  try {
    const stats = await generateMonthlyRemindersForShop(shopId, targetPeriod, {
      min_amount,
      language,
      urgency
    });
    res.json({ message: 'Monthly reminders generated successfully', stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credit-reminders/:id/mark-sent', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const [result] = await db.execute(
      'UPDATE credit_reminders SET status = "sent", sent_at = NOW() WHERE id = ? AND shop_id = ?',
      [req.params.id, req.user.shop_id || 1]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ message: 'Marked as sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credit-reminders/bulk-mark-sent', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Valid array of reminder ids is required' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await db.execute(
      `UPDATE credit_reminders SET status = "sent", sent_at = NOW() WHERE id IN (${placeholders}) AND shop_id = ?`,
      [...ids, req.user.shop_id || 1]
    );
    res.json({ message: `Marked ${ids.length} reminders as sent` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credit-reminders/:id/dismiss', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const [result] = await db.execute(
      'UPDATE credit_reminders SET status = "dismissed" WHERE id = ? AND shop_id = ?',
      [req.params.id, req.user.shop_id || 1]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ message: 'Reminder dismissed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/credit-reminders/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { message_text, language } = req.body;
  try {
    await db.execute(
      'UPDATE credit_reminders SET message_text = COALESCE(?, message_text), language = COALESCE(?, language) WHERE id = ? AND shop_id = ?',
      [message_text, language, req.params.id, req.user.shop_id || 1]
    );
    res.json({ message: 'Reminder updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings API
app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT setting_key, setting_value FROM shop_settings WHERE shop_id = ?', [req.user.shop_id || 1]);
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only admin can update settings' });
  }
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Invalid settings format' });

  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.execute('INSERT INTO shop_settings (setting_key, setting_value, shop_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, req.user.shop_id || 1, value]);
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', verifyToken, [
  body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
  body('shippingAddress').optional({ checkFalsy: true }).isString().trim().escape(),
  body('paymentMethod').optional({ checkFalsy: true }).isString().trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, totalAmount, shippingAddress, paymentMethod, subtotal, coupon_discount, cgst_amount, sgst_amount, rounding_adjustment, utrNumber } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole === 'admin' || userRole === 'owner') {
    return res.status(403).json({ error: 'Admins cannot place retail orders' });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must have at least one item' });
  }

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let initialStatus = 'processing';
    if (paymentMethod === 'UPI') initialStatus = 'pending_verification';

    let orderFarmerId = null;
    let orderCustomerName = 'Online Customer';

    if (paymentMethod === 'Credit') {
      if (!req.user.farmer_id) {
        await connection.rollback();
        return res.status(400).json({ error: 'User is not linked to a farmer profile for credit payments' });
      }

      const [[farmer]] = await connection.execute('SELECT current_credit, credit_limit, name FROM farmers WHERE id = ?', [req.user.farmer_id]);
      if (!farmer) {
        await connection.rollback();
        return res.status(400).json({ error: 'Farmer profile not found' });
      }

      const availableCredit = parseFloat(farmer.credit_limit) - parseFloat(farmer.current_credit);
      if (availableCredit < totalAmount) {
        await connection.rollback();
        return res.status(400).json({ error: 'Insufficient in-store credit balance' });
      }

      await connection.execute('UPDATE farmers SET current_credit = current_credit + ? WHERE id = ?', [totalAmount, req.user.farmer_id]);
      
      // Log the credit purchase
      await connection.execute(
        `INSERT INTO farmer_interest_transactions 
         (farmer_id, transaction_type, amount, principal_amount, interest_amount, reference_id, performed_by) 
         VALUES (?, 'CREDIT_PURCHASE', ?, ?, 0, ?, ?)`,
        [req.user.farmer_id, totalAmount, totalAmount, orderNumber, userId]
      );

      orderFarmerId = req.user.farmer_id;
      orderCustomerName = farmer.name;
    } else {
      const [[user]] = await connection.execute('SELECT username, phone, farmer_id FROM users WHERE id = ?', [userId]);
      if (user) {
        orderCustomerName = user.username;
        if (user.farmer_id) {
          orderFarmerId = user.farmer_id;
        } else {
          // Try to match or create farmer to link the account
          if (user.phone) {
            const [[existing]] = await connection.execute('SELECT id, name FROM farmers WHERE phone = ? AND shop_id = ? LIMIT 1', [user.phone, req.user.shop_id || 1]);
            if (existing) {
              orderFarmerId = existing.id;
              orderCustomerName = existing.name;
            } else {
              const [insertRes] = await connection.execute(
                'INSERT INTO farmers (name, phone, shop_id, status) VALUES (?, ?, ?, ?)',
                [orderCustomerName, user.phone, req.user.shop_id || 1, 'active']
              );
              orderFarmerId = insertRes.insertId;
            }
          } else {
            const [[existing]] = await connection.execute('SELECT id FROM farmers WHERE name = ? AND shop_id = ? LIMIT 1', [orderCustomerName, req.user.shop_id || 1]);
            if (existing) {
              orderFarmerId = existing.id;
            } else {
              const [insertRes] = await connection.execute(
                'INSERT INTO farmers (name, phone, shop_id, status) VALUES (?, ?, ?, ?)',
                [orderCustomerName, null, req.user.shop_id || 1, 'active']
              );
              orderFarmerId = insertRes.insertId;
            }
          }
          await connection.execute('UPDATE users SET farmer_id = ? WHERE id = ?', [orderFarmerId, userId]);
        }
      }
    }

    let orderCustomerPhone = null;
    const [[userForPhone]] = await connection.execute('SELECT phone FROM users WHERE id = ?', [userId]);
    if (userForPhone && userForPhone.phone) orderCustomerPhone = userForPhone.phone;

    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method, subtotal, coupon_discount, cgst_amount, sgst_amount, rounding_adjustment, utr_number, status, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        orderNumber,
        totalAmount,
        shippingAddress !== undefined ? shippingAddress : null,
        paymentMethod !== undefined ? paymentMethod : null,
        subtotal || 0,
        coupon_discount || 0,
        cgst_amount || 0,
        sgst_amount || 0,
        rounding_adjustment || 0,
        utrNumber || null,
        initialStatus,
        req.user.shop_id || 1
      ]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.id, item.name, item.quantity, item.price, item.price * item.quantity]
      );
    }

    // Insert corresponding sale for reports
    const [saleResult] = await connection.execute(
      'INSERT INTO sales (farmer_id, customer_name, customer_phone, total_amount, payment_method, shop_id, sale_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderFarmerId, orderCustomerName, orderCustomerPhone, totalAmount, paymentMethod || 'Online Payment', req.user.shop_id || 1, 'online']
    );
    const saleId = saleResult.insertId;

    for (const item of items) {
      await connection.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)',
        [saleId, item.id, item.quantity, item.price, item.price * item.quantity]
      );
    }

    if (paymentMethod !== 'Cash on Delivery' && paymentMethod !== 'COD') {
      // Add to payments as income ONLY if it's paid immediately online
      await connection.execute(
        'INSERT INTO payments (sale_id, amount, payment_method, payment_type, notes, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, totalAmount, paymentMethod || 'Online Payment', 'income', `Online order ${orderNumber}`, req.user.shop_id || 1]
      );
    }

    for (const item of items) {
      await connection.execute(
        'UPDATE products SET quantity = quantity - ? WHERE id = ? AND shop_id = ?',
        [item.quantity, item.id, req.user.shop_id || 1]
      );
    }

    await connection.commit();
    res.json({ id: orderId, orderNumber, message: 'Order placed successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Get user orders and in-store purchases
app.get('/api/orders', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const farmerId = req.user.farmer_id; // Added to token on login

  try {
    // 1. Fetch online orders
    const [orderRows] = await db.execute(`
      SELECT
        o.*,
        'online' as purchase_type,
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
      WHERE o.user_id = ? AND o.shop_id = ?
      GROUP BY o.id
    `, [userId, req.user.shop_id || 1]);

    const onlineOrders = orderRows.map(row => ({
      ...row,
      items: row.items_json ? JSON.parse(`[${row.items_json}]`) : []
    }));

    // 2. Fetch in-store purchases if user is linked to a farmer
    let inStorePurchases = [];
    if (farmerId) {
      const salesHasFarmerId = await columnExists('sales', 'farmer_id');
      if (salesHasFarmerId) {
        const [saleRows] = await db.execute(`
          SELECT
            s.id,
            s.sale_date as created_at,
            s.total_amount,
            'delivered' as status,
            s.payment_method,
            'in-store' as purchase_type,
            GROUP_CONCAT(
              JSON_OBJECT(
                'id', si.product_id,
                'name', p.name,
                'quantity', si.quantity,
                'price', si.price_per_unit,
                'totalPrice', si.total_price
              )
            ) as items_json
          FROM sales s
          LEFT JOIN sale_items si ON s.id = si.sale_id
          LEFT JOIN products p ON si.product_id = p.id
          WHERE s.farmer_id = ? AND s.shop_id = ? AND (s.sale_type IS NULL OR s.sale_type != 'online')
          GROUP BY s.id
        `, [farmerId, req.user.shop_id || 1]);

        inStorePurchases = saleRows.map(row => ({
          ...row,
          items: row.items_json ? JSON.parse(`[${row.items_json}]`) : []
        }));
      }
    }

    // 3. Merge and sort by date descending
    const allPurchases = [...onlineOrders, ...inStorePurchases].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json(allPurchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order or in-store purchase
app.get('/api/orders/:id', verifyToken, async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const farmerId = req.user.farmer_id;

  try {
    // 1. Try to find in online orders
    const [[order]] = await db.execute('SELECT * FROM orders WHERE id = ? AND user_id = ? AND shop_id = ?', [orderId, userId, req.user.shop_id || 1]);
    
    if (order) {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      return res.json({ ...order, items, purchase_type: 'online' });
    }

    // 2. Try to find in in-store sales if user is linked to a farmer
    if (farmerId) {
      const salesHasFarmerId = await columnExists('sales', 'farmer_id');
      if (salesHasFarmerId) {
        const [[sale]] = await db.execute('SELECT *, sale_date as created_at, "delivered" as status, "paid" as payment_status FROM sales WHERE id = ? AND farmer_id = ? AND shop_id = ? AND (sale_type IS NULL OR sale_type != "online")', [orderId, farmerId, req.user.shop_id || 1]);
        
        if (sale) {
          const [saleItems] = await db.execute(`
            SELECT si.*, p.name as product_name
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
          `, [orderId]);
          
          return res.json({ ...sale, items: saleItems, purchase_type: 'in-store' });
        }
      }
    }

    // Not found in either
    return res.status(404).json({ error: 'Order not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all orders
app.get('/api/admin/orders', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const [rows] = await db.execute(`
      SELECT 
        o.*,
        u.username as customer_name,
        u.email as customer_email,
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
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.shop_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.shop_id || 1]);

    const orders = rows.map(row => ({
      ...row,
      items: row.items_json ? JSON.parse(`[${row.items_json}]`) : []
    }));

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Convert COD to Credit
app.put('/api/admin/orders/:id/convert-credit', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const orderId = req.params.id;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [[order]] = await connection.execute(
      'SELECT total_amount, status, payment_status, payment_method, order_number FROM orders WHERE id = ? AND shop_id = ? FOR UPDATE',
      [orderId, req.user.shop_id || 1]
    );

    if (!order) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.payment_method !== 'Cash on Delivery' && order.payment_method !== 'COD') {
      await connection.rollback();
      return res.status(400).json({ error: 'Only COD orders can be converted to credit' });
    }

    if (order.payment_status === 'paid' || order.status === 'delivered') {
      await connection.rollback();
      return res.status(400).json({ error: 'Order is already paid or delivered' });
    }

    // Find the farmer_id
    const [[userOrder]] = await connection.execute('SELECT user_id FROM orders WHERE id = ?', [orderId]);
    const [[user]] = await connection.execute('SELECT farmer_id FROM users WHERE id = ?', [userOrder.user_id]);
    
    if (!user || !user.farmer_id) {
      await connection.rollback();
      return res.status(400).json({ error: 'Customer is not linked to a farmer profile.' });
    }

    const farmerId = user.farmer_id;

    const [[farmer]] = await connection.execute(
      'SELECT current_credit, credit_limit FROM farmers WHERE id = ? FOR UPDATE',
      [farmerId]
    );

    const availableCredit = parseFloat(farmer.credit_limit) - parseFloat(farmer.current_credit);
    if (parseFloat(farmer.credit_limit) > 0 && availableCredit < parseFloat(order.total_amount)) {
      await connection.rollback();
      return res.status(400).json({ error: `Insufficient credit limit. Available: ₹${availableCredit.toFixed(2)}` });
    }

    // Update farmer credit
    await connection.execute('UPDATE farmers SET current_credit = current_credit + ? WHERE id = ?', [order.total_amount, farmerId]);

    // Insert CREDIT_PURCHASE
    await connection.execute(
      `INSERT INTO farmer_interest_transactions 
       (farmer_id, transaction_type, amount, principal_amount, interest_amount, reference_id, performed_by) 
       VALUES (?, 'CREDIT_PURCHASE', ?, ?, 0, ?, ?)`,
      [farmerId, order.total_amount, order.total_amount, order.order_number, req.user.id]
    );

    // Update order status
    await connection.execute(
      'UPDATE orders SET payment_status = ?, payment_method = ? WHERE id = ?',
      ['unpaid', 'Credit', orderId]
    );

    // Update the corresponding sale's payment_method to Credit
    await connection.execute(
      'UPDATE sales SET payment_method = ? WHERE total_amount = ? AND shop_id = ? AND customer_name IN (SELECT username FROM users WHERE id = ?)',
      ['Credit', order.total_amount, req.user.shop_id || 1, userOrder.user_id]
    );

    await connection.commit();
    res.json({ message: 'Order converted to Credit successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Admin: Mark COD Order as Paid
app.put('/api/admin/orders/:id/mark-paid', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const orderId = req.params.id;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [[order]] = await connection.execute(
      'SELECT total_amount, status, payment_status, payment_method, order_number FROM orders WHERE id = ? AND shop_id = ? FOR UPDATE',
      [orderId, req.user.shop_id || 1]
    );

    if (!order) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.payment_status === 'paid') {
      await connection.rollback();
      return res.status(400).json({ error: 'Order is already marked as paid' });
    }

    // Update order status
    await connection.execute(
      'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
      ['paid', 'delivered', orderId]
    );

    // Insert into payments
    const [[userOrder]] = await connection.execute('SELECT user_id FROM orders WHERE id = ?', [orderId]);
    
    // Attempt to find sale
    const [[sale]] = await connection.execute(
      'SELECT id FROM sales WHERE total_amount = ? AND shop_id = ? AND customer_name IN (SELECT username FROM users WHERE id = ?) ORDER BY id DESC LIMIT 1',
      [order.total_amount, req.user.shop_id || 1, userOrder.user_id]
    );

    await connection.execute(
      'INSERT INTO payments (sale_id, amount, payment_method, payment_type, notes, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
      [sale ? sale.id : null, order.total_amount, order.payment_method, 'income', `Online order ${order.order_number} COD paid`, req.user.shop_id || 1]
    );

    await connection.commit();
    res.json({ message: 'Order marked as paid successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Admin: Update order status
app.put('/api/admin/orders/:id/status', verifyToken, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== 'admin' && userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const orderId = req.params.id;
  const { status, payment_status } = req.body;

  try {
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (payment_status) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(orderId, req.user.shop_id || 1);

    const [result] = await db.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ? AND shop_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order updated successfully' });
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
  const prodId = req.body.product_id || req.body.productId;
  const quantity = parseInt(req.body.quantity, 10);
  const userId = req.user.id;

  if (!prodId || isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Product ID and valid quantity (> 0) are required' });
  }

  try {
    const [[product]] = await db.execute('SELECT quantity FROM products WHERE id = ?', [prodId]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient product quantity' });

    const [[existing]] = await db.execute('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, prodId]);

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > product.quantity) return res.status(400).json({ error: 'Total quantity exceeds available stock' });
      await db.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, existing.id]);
      res.json({ message: 'Cart item updated successfully' });
    } else {
      const [result] = await db.execute('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [
        userId,
        prodId,
        quantity !== undefined ? quantity : 1
      ]);
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

  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }

  try {
    if (quantity === 0) {
      const [deleteResult] = await db.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
      if (deleteResult.affectedRows === 0) return res.status(404).json({ error: 'Cart item not found' });
      return res.json({ message: 'Item removed from cart successfully' });
    }

    const [[product]] = await db.execute('SELECT quantity FROM products WHERE id = ?', [productId]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient product quantity' });

    const [updateResult] = await db.execute('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [
      quantity !== undefined ? quantity : 0,
      userId,
      productId
    ]);
    if (updateResult.affectedRows === 0) return res.status(404).json({ error: 'Cart item not found' });
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
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cart item not found' });
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

// Submit survey
app.post('/api/survey', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const responses = JSON.stringify(req.body);

  if (!responses || responses === '{}') {
    return res.status(400).json({ error: 'Survey responses are required' });
  }

  try {
    const [result] = await db.execute('INSERT INTO surveys (user_id, responses) VALUES (?, ?)', [
      userId,
      responses !== undefined ? responses : '{}'
    ]);
    res.json({ id: result.insertId, message: 'Survey submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all surveys (admin only)
app.get('/api/surveys', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  try {
    const [rows] = await db.execute(`
      SELECT s.id, s.responses, s.submitted_at, u.username, u.email, u.role
      FROM surveys s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.submitted_at DESC
    `);

    const surveys = rows.map(row => ({
      ...row,
      responses: JSON.parse(row.responses)
    }));

    res.json(surveys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Compatibility API ────────────────────────────────────────────────────────

// GET /api/compatibility/rules
app.get('/api/compatibility/rules', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT pc.*,
             p1.name as product1_name, p1.type as product1_type,
             p2.name as product2_name, p2.type as product2_type
      FROM product_compatibility pc
      JOIN products p1 ON pc.product1_id = p1.id
      JOIN products p2 ON pc.product2_id = p2.id
      ORDER BY pc.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compatibility/check
app.post('/api/compatibility/check', verifyToken, async (req, res) => {
  const { productIds, cropId } = req.body;

  if (!productIds || productIds.length < 2) {
    return res.status(400).json({ error: 'At least 2 product IDs are required' });
  }

  try {
    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      SELECT pc.*,
             p1.name as product1_name, p1.type as product1_type,
             p2.name as product2_name, p2.type as product2_type
      FROM product_compatibility pc
      JOIN products p1 ON pc.product1_id = p1.id
      JOIN products p2 ON pc.product2_id = p2.id
      WHERE (pc.product1_id IN (${placeholders}) AND pc.product2_id IN (${placeholders}))
         OR (pc.product2_id IN (${placeholders}) AND pc.product1_id IN (${placeholders}))
    `;

    const [rules] = await db.execute(query, [...productIds, ...productIds, ...productIds, ...productIds]);

    // Fetch crop-specific advice if cropId is provided
    let cropAdvice = [];
    let cropName = '';
    if (cropId) {
      const [[crop]] = await db.execute('SELECT name FROM crops WHERE id = ?', [cropId]);
      if (crop) cropName = crop.name;

      const [cropRows] = await db.execute(`
        SELECT pcc.*, p.name as product_name
        FROM product_crop_compatibility pcc
        JOIN products p ON pcc.product_id = p.id
        WHERE pcc.crop_id = ? AND pcc.product_id IN (${placeholders})
      `, [cropId, ...productIds]);
      cropAdvice = cropRows;
    }

    let compatible = true;
    const warnings = [];
    const safeCombinations = [];
    const dangerousMixes = [];

    for (let i = 0; i < productIds.length; i++) {
      for (let j = i + 1; j < productIds.length; j++) {
        const product1Id = productIds[i];
        const product2Id = productIds[j];

        const rule = rules.find(r =>
          (r.product1_id === product1Id && r.product2_id === product2Id) ||
          (r.product1_id === product2Id && r.product2_id === product1Id)
        );

        if (rule) {
          const productNames = [rule.product1_name, rule.product2_name];

          if (rule.compatibility_type === 'incompatible') {
            compatible = false;
            dangerousMixes.push({ products: productNames, reason: rule.reason || 'Incompatible combination' });
          } else if (rule.compatibility_type === 'caution') {
            warnings.push(`Caution with ${productNames.join(' + ')}: ${rule.reason || 'Potential issues'}`);
          } else if (rule.compatibility_type === 'compatible') {
            safeCombinations.push({ products: productNames, notes: rule.reason || 'Safe combination' });
          }
        }
      }
    }

    res.json({
      compatible,
      warnings,
      safeCombinations,
      dangerousMixes,
      cropAdvice,
      cropName,
      recommendations: compatible ? ['All selected products are compatible'] : ['Review dangerous mixes before application']
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compatibility/rules (admin only)
app.post('/api/compatibility/rules', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  const { product1Id, product2Id, compatibilityType, reason, cropSpecific } = req.body;

  if (!product1Id || !product2Id || !compatibilityType) {
    return res.status(400).json({ error: 'product1Id, product2Id, and compatibilityType are required' });
  }

  if (!['compatible', 'incompatible', 'caution'].includes(compatibilityType)) {
    return res.status(400).json({ error: 'compatibilityType must be compatible, incompatible, or caution' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO product_compatibility (product1_id, product2_id, compatibility_type, reason, crop_specific) VALUES (?, ?, ?, ?, ?)',
      [
        product1Id,
        product2Id,
        compatibilityType,
        reason !== undefined ? reason : null,
        cropSpecific ? 1 : 0
      ]
    );
    res.json({ id: result.insertId, message: 'Compatibility rule added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Compatibility rule already exists for these products' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/compatibility/rules/:id (admin only)
app.put('/api/compatibility/rules/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  const { compatibilityType, reason, cropSpecific } = req.body;

  if (!compatibilityType) {
    return res.status(400).json({ error: 'compatibilityType is required' });
  }

  if (!['compatible', 'incompatible', 'caution'].includes(compatibilityType)) {
    return res.status(400).json({ error: 'compatibilityType must be compatible, incompatible, or caution' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE product_compatibility SET compatibility_type = ?, reason = ?, crop_specific = ? WHERE id = ?',
      [
        compatibilityType,
        reason !== undefined ? reason : null,
        cropSpecific ? 1 : 0,
        req.params.id
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Compatibility rule not found' });
    res.json({ message: 'Compatibility rule updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/compatibility/rules/:id (admin only)
app.delete('/api/compatibility/rules/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  try {
    const [result] = await db.execute('DELETE FROM product_compatibility WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Compatibility rule not found' });
    res.json({ message: 'Compatibility rule deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crops
app.get('/api/crops', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM crops WHERE shop_id = ? ORDER BY name', [req.user.shop_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PHASE 3: IoT & WhatsApp Webhook Integrations
// ==========================================

// POST /api/webhook/whatsapp
// Receives incoming messages from WhatsApp/Twilio for chat-based ordering
app.post('/api/webhook/whatsapp', async (req, res) => {
  try {
    const incomingMsg = req.body.Body || req.body.message || '';
    const sender = req.body.From || req.body.sender || 'Unknown';

    console.log(`[WhatsApp Webhook] Received message from ${sender}: ${incomingMsg}`);

    const lowerMsg = incomingMsg.toLowerCase();
    let replyText = "Welcome to the Fertilizer Shop WhatsApp Bot! Send 'Order [Product Name]' to place an order.";

    if (lowerMsg.startsWith('order ')) {
      const productQuery = lowerMsg.replace('order ', '').trim();
      
      const [products] = await db.execute('SELECT * FROM products WHERE name LIKE ?', [`%${productQuery}%`]);
      
      if (products.length > 0) {
        const product = products[0];
        replyText = `Great! We have ${product.name} in stock at ₹${product.price}. Your order has been placed in pending status. We will contact you shortly to confirm.`;
      } else {
        replyText = `Sorry, we couldn't find a product matching "${productQuery}". Please check our catalog and try again.`;
      }
    } else if (lowerMsg.includes('status')) {
       replyText = "Your recent orders are being processed. Thank you for shopping with us!";
    }

    res.setHeader('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>${replyText}</Message>
      </Response>
    `);
  } catch (err) {
    console.error('[WhatsApp Webhook Error]', err);
    res.status(500).send('Internal Server Error');
  }
});

// ==========================================
// PHASE 3: n8n AI Agent APIs
// ==========================================

// GET /api/n8n/inventory
// Allows AI to check stock and pricing. Search via ?search=query
app.get('/api/n8n/inventory', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const [rows] = await db.execute('SELECT id, name, price, quantity, description FROM products WHERE name LIKE ?', [`%${searchQuery}%`]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/n8n/advice
// Allows AI to get crop compatibility rules. Search via ?crop=name
app.get('/api/n8n/advice', async (req, res) => {
  try {
    const cropQuery = req.query.crop || '';
    const [rows] = await db.execute(`
      SELECT p.name as product_name, c.name as crop_name, pcc.recommended_dosage, pcc.warnings 
      FROM product_crop_compatibility pcc
      JOIN products p ON pcc.product_id = p.id
      JOIN crops c ON pcc.crop_id = c.id
      WHERE c.name LIKE ?
    `, [`%${cropQuery}%`]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/n8n/order
// Allows AI to place a pending order
app.post('/api/n8n/order', async (req, res) => {
  try {
    const { customerPhone, productName, quantity } = req.body;
    
    // Simplistic logic for n8n to log an order
    const [products] = await db.execute('SELECT * FROM products WHERE name = ?', [productName]);
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const product = products[0];
    const totalAmount = product.price * (quantity || 1);
    
    // In a real scenario, you'd insert into orders, order_items, or sales.
    // For now, we'll just log it and return a mock order ID
    const orderId = 'ORD-' + Math.floor(Math.random() * 100000);
    
    console.log(`[n8n AI Order Created] ${orderId} - ${product.name} (x${quantity}) for ${customerPhone}. Total: ${totalAmount}`);
    
    res.json({ 
      success: true, 
      orderId, 
      totalAmount,
      message: `Order ${orderId} placed successfully.`
    });
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

const startServer = (port) => {
  const server = app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    await connectDatabase();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.error(`Port ${port} is already in use. Trying port ${nextPort}...`);
      startServer(nextPort);
    } else {
      throw err;
    }
  });
};

startServer(PORT);
