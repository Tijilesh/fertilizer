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
    });

    console.log('Connected to MySQL database.');
    await initializeDatabase();
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

  if (!(await columnExists('sales', 'farmer_id'))) {
    await db.execute(`ALTER TABLE sales ADD COLUMN farmer_id INT NULL`);
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

  // Ensure unique constraint on products.name even if table existed earlier
  try {
    await db.execute('ALTER TABLE products ADD UNIQUE KEY uniq_products_name (name)');
  } catch (e) {
    // ignore if already exists
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
      `INSERT INTO products (name, type, price, quantity, supplier, description)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         type = VALUES(type),
         price = VALUES(price),
         quantity = GREATEST(quantity, VALUES(quantity)),
         supplier = VALUES(supplier),
         description = VALUES(description)`,
      [product.name, product.type, product.price, product.quantity, product.supplier, product.description]
    );
  }

  const [[{ count: productCount }]] = await db.execute('SELECT COUNT(*) as count FROM products');
  console.log(`Ensured demo products from JSON. Total products: ${productCount}`);

  // Seed demo sales
  const [[{ count: salesCount }]] = await db.execute('SELECT COUNT(*) as count FROM sales');
  if (salesCount === 0) {
    const [[npk]] = await db.execute('SELECT id, price FROM products WHERE name = ? LIMIT 1', ['NPK 20-20-20']);
    const [[urea]] = await db.execute('SELECT id, price FROM products WHERE name = ? LIMIT 1', ['Urea']);

    const [sale1] = await db.execute(
      'INSERT INTO sales (customer_name, customer_phone, total_amount, payment_method) VALUES (?, ?, ?, ?)',
      ['Ravi Kumar', '9876543210', 2400, 'Cash']
    );
    if (npk) {
      await db.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)',
        [sale1.insertId, npk.id, 2, npk.price, npk.price * 2]
      );
      await db.execute('UPDATE products SET quantity = quantity - 2 WHERE id = ?', [npk.id]);
    }

    const [sale2] = await db.execute(
      'INSERT INTO sales (customer_name, customer_phone, total_amount) VALUES (?, ?, ?)',
      ['Sita Devi', '9123456780', 900]
    );
    if (urea) {
      await db.execute(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)',
        [sale2.insertId, urea.id, 1, urea.price, urea.price]
      );
      await db.execute('UPDATE products SET quantity = quantity - 1 WHERE id = ?', [urea.id]);
    }
    console.log('Seeded demo sales');
  }

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

  const [[{ count: creditCount }]] = await db.execute('SELECT COUNT(*) as count FROM credit_reminders');
  if (creditCount === 0) {
    const demoReminders = [
      ['Ravi Kumar', 5000, '2024-01-15', 'overdue'],
      ['Sita Devi', 3000, '2024-01-20', 'due'],
      ['Amit Patel', 1500, '2024-01-25', 'due']
    ];
    for (const reminder of demoReminders) {
      await db.execute('INSERT INTO credit_reminders (customer_name, amount, due_date, status) VALUES (?, ?, ?, ?)', reminder);
    }
  }
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
    const [[{ salesRevenue }]] = await db.execute('SELECT SUM(total_amount) as salesRevenue FROM sales');
    const [[{ ordersRevenue }]] = await db.execute('SELECT SUM(total_amount) as ordersRevenue FROM orders');
    const totalRevenue = (Number(salesRevenue) || 0) + (Number(ordersRevenue) || 0);

    const [[{ totalProducts }]] = await db.execute('SELECT COUNT(*) as totalProducts FROM products');
    const [[{ totalFarmers }]] = await db.execute('SELECT COUNT(*) as totalFarmers FROM farmers');

    const [[{ totalSales }]] = await db.execute('SELECT COUNT(*) as totalSales FROM sales');
    const [[{ totalOrders }]] = await db.execute('SELECT COUNT(*) as totalOrders FROM orders');
    const totalTransactions = (Number(totalSales) || 0) + (Number(totalOrders) || 0);
    
    const avgOrderValue = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;

    res.json({
      totalRevenue: totalRevenue || 0,
      totalProducts: totalProducts || 0,
      totalFarmers: totalFarmers || 0,
      averageOrderValue: avgOrderValue || 0,
      revenueGrowth: 12.5, // Logic for growth can be added here
      productGrowth: 5.2,
      customerGrowth: 8.1,
      orderGrowth: -2.3
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/farmer-tips', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM farmer_tips ORDER BY created_at DESC LIMIT 3');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/seasonal-offers', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM seasonal_offers WHERE valid_until > NOW() ORDER BY valid_until ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/credit-reminders', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM credit_reminders ORDER BY due_date ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/summary', verifyToken, async (req, res) => {
  try {
    // Monthly sales (combining sales and orders)
    const [monthlySales] = await db.execute(`
      SELECT month, SUM(sales) as sales FROM (
        SELECT DATE_FORMAT(sale_date, '%b') as month, total_amount as sales, sale_date as date FROM sales WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        UNION ALL
        SELECT DATE_FORMAT(created_at, '%b') as month, total_amount as sales, created_at as date FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      ) combined
      GROUP BY month
      ORDER BY MIN(date)
    `);

    // Category distribution
    const [categoryData] = await db.execute(`
      SELECT type as name, COUNT(*) as value
      FROM products
      GROUP BY type
    `);

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
    const [[{ totalRevenue }]] = await db.execute('SELECT SUM(total_amount) as totalRevenue FROM sales');
    // Simple 18% GST calculation for demonstration
    const totalGST = (totalRevenue || 0) * 0.18;

    const [recentInvoices] = await db.execute(`
      SELECT id, id as invoiceNumber, customer_name as customer, total_amount as totalAmount, 
             (total_amount * 0.18) as gstAmount, (total_amount * 0.82) as amount,
             DATE_FORMAT(sale_date, '%Y-%m-%d') as date, 'paid' as status
      FROM sales
      ORDER BY sale_date DESC
      LIMIT 10
    `);

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
    const [rows] = await db.execute(`
      SELECT id, name as productName, batch_number as batchNumber, quantity, 
             DATE_FORMAT(expiry_date, '%Y-%m-%d') as expiryDate,
             DATEDIFF(expiry_date, NOW()) as daysUntilExpiry,
             supplier, price as cost, (price * quantity) as totalValue,
             CASE 
               WHEN expiry_date < NOW() THEN 'expired'
               WHEN DATEDIFF(expiry_date, NOW()) <= 7 THEN 'critical'
               WHEN DATEDIFF(expiry_date, NOW()) <= 30 THEN 'warning'
               ELSE 'safe'
             END as status
      FROM products
      WHERE expiry_date IS NOT NULL
      ORDER BY expiry_date ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suppliers Endpoints
app.get('/api/suppliers', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', verifyToken, async (req, res) => {
  const { name, contact_person, phone, email, address, credit_limit } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO suppliers (name, contact_person, phone, email, address, credit_limit) VALUES (?, ?, ?, ?, ?, ?)',
      [
        name,
        contact_person !== undefined ? contact_person : null,
        phone !== undefined ? phone : null,
        email !== undefined ? email : null,
        address !== undefined ? address : null,
        credit_limit !== undefined ? credit_limit : 0
      ]
    );
    res.status(201).json({ id: result.insertId, name, contact_person, phone, email, address, credit_limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, contact_person, phone, email, address, credit_limit, status } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE suppliers
       SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, credit_limit = ?, status = ?
       WHERE id = ?`,
      [
        name,
        contact_person !== undefined ? contact_person : null,
        phone !== undefined ? phone : null,
        email !== undefined ? email : null,
        address !== undefined ? address : null,
        credit_limit !== undefined ? credit_limit : 0,
        status || 'active',
        id
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
    const [result] = await db.execute('DELETE FROM suppliers WHERE id = ?', [id]);
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
      ORDER BY po.order_date DESC
    `);

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
      'INSERT INTO purchase_orders (supplier_id, order_date, delivery_date, total_amount) VALUES (?, ?, ?, ?)',
      [
        supplier_id,
        order_date !== undefined ? order_date : null,
        delivery_date !== undefined ? delivery_date : null,
        total_amount
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
      'INSERT INTO payments (purchase_order_id, amount, payment_method, payment_type, notes) VALUES (?, ?, ?, ?, ?)',
      [orderId, total_amount, 'Bank Transfer', 'expense', `Purchase Order #${orderId}`]
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
      'UPDATE purchase_orders SET status = COALESCE(?, status), delivery_date = COALESCE(?, delivery_date) WHERE id = ?',
      [status || null, delivery_date || null, id]
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
      'SELECT supplier_id, total_amount FROM purchase_orders WHERE id = ?',
      [id]
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
    await connection.execute('DELETE FROM purchase_orders WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
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
      ORDER BY p.payment_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', verifyToken, async (req, res) => {
  const { sale_id, purchase_order_id, amount, payment_method, payment_type, status, notes } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO payments (sale_id, purchase_order_id, amount, payment_method, payment_type, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sale_id || null,
        purchase_order_id || null,
        amount,
        payment_method || 'Cash',
        payment_type,
        status || 'completed',
        notes || null
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
       WHERE id = ?`,
      [amount ?? null, payment_method || null, status || null, notes || null, id]
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
    const [result] = await db.execute('DELETE FROM payments WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/smart-assistant/query', verifyToken, async (req, res) => {
  const { message, farmData } = req.body;
  // Simple rule-based response for simulation
  let responseText = "As your Smart Assistant, I'm analyzing your request. ";

  if (message.toLowerCase().includes('weather')) {
    responseText += "The current weather is favorable, but keep an eye on humidity levels which are at 65%.";
  } else if (message.toLowerCase().includes('fertilizer') || message.toLowerCase().includes('npk')) {
    responseText += "Based on your loamy soil, I recommend a balanced NPK application. Ensure you don't over-apply before rain.";
  } else {
    responseText += "I see you're asking about " + message + ". For your farm size of " + (farmData?.farmSize || 'standard') + " acres, I suggest optimizing your nitrogen use efficiency.";
  }

  res.json({ text: responseText });
});

// Register user
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, role, otp } = req.body;

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
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [
        username,
        email,
        hashedPassword,
        role !== undefined ? role : 'user'
      ]
    );

    // Delete OTP ONLY after successful registration
    await db.execute('DELETE FROM email_otps WHERE email = ?', [email]);

    const token = jwt.sign({ id: result.insertId, username, email, role: role || 'user' }, 'your-secret-key', { expiresIn: '24h' });
    res.json({ token, user: { id: result.insertId, username, email, role: role || 'user' } });
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
    const [[user]] = await db.execute('SELECT id, username, email, password, role FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, 'your-secret-key', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products
app.get('/api/products', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
app.get('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
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
    const [result] = await db.execute(
      'INSERT INTO products (name, type, price, quantity, supplier, description, batch_number, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        type,
        price,
        quantity || 0,
        supplier !== undefined ? supplier : null,
        description !== undefined ? description : null,
        batch_number !== undefined ? batch_number : null,
        expiry_date !== undefined ? expiry_date : null
      ]
    );
    res.json({ id: result.insertId, message: 'Product added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
app.put('/api/products/:id', verifyToken, async (req, res) => {
  const { name, type, price, quantity, supplier, description, batch_number, expiry_date } = req.body;

  try {
    const [result] = await db.execute(
      'UPDATE products SET name = ?, type = ?, price = ?, quantity = ?, supplier = ?, description = ?, batch_number = ?, expiry_date = ? WHERE id = ?',
      [
        name,
        type,
        price,
        quantity !== undefined ? quantity : 0,
        supplier !== undefined ? supplier : null,
        description !== undefined ? description : null,
        batch_number !== undefined ? batch_number : null,
        expiry_date !== undefined ? expiry_date : null,
        req.params.id
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
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
    const [[sale]] = await db.execute('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

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

    const [saleResult] = await connection.execute(
      'INSERT INTO sales (customer_name, customer_phone, total_amount, payment_method) VALUES (?, ?, ?, ?)',
      [
        customer_name !== undefined ? customer_name : null,
        customer_phone !== undefined ? customer_phone : null,
        total_amount,
        req.body.payment_method || 'Cash'
      ]
    );
    const saleId = saleResult.insertId;

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

    // Add to payments as income
    await connection.execute(
      'INSERT INTO payments (sale_id, amount, payment_method, payment_type, notes) VALUES (?, ?, ?, ?, ?)',
      [saleId, total_amount, req.body.payment_method || 'Cash', 'income', `Sale to ${customer_name}`]
    );

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
    const [[sale]] = await connection.execute('SELECT * FROM sales WHERE id = ?', [saleId]);
    if (!sale) {
      await connection.rollback();
      return res.status(404).json({ error: 'Sale not found' });
    }

    const [items] = await connection.execute('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

    // Restore product quantities
    for (const item of items) {
      await connection.execute(
        'UPDATE products SET quantity = quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
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

// ── Farmer Management Endpoints ────────────────────────────────────────────

// Get all farmers (admin/owner only)
app.get('/api/farmers', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const salesHasFarmerId = await columnExists('sales', 'farmer_id');

    // Auto-sync online customers into the farmers CRM table
    await db.execute(`
      INSERT INTO farmers (name, email, phone, status)
      SELECT DISTINCT 
        u.username as name, 
        u.email, 
        '' as phone, 
        'active' as status
      FROM users u 
      JOIN orders o ON u.id = o.user_id
      WHERE u.email IS NOT NULL 
      AND u.email != ''
      AND u.email NOT IN (SELECT email FROM farmers WHERE email IS NOT NULL AND email != '')
    `);

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
          GROUP BY f.id
          ORDER BY f.name ASC
        `)
      : await db.execute(`
          SELECT 
            f.*, 
            COALESCE((SELECT COUNT(DISTINCT o.id) FROM orders o JOIN users u ON o.user_id = u.id WHERE u.email = f.email), 0) as total_purchases,
            COALESCE((SELECT SUM(o.total_amount) FROM orders o JOIN users u ON o.user_id = u.id WHERE u.email = f.email), 0) as total_spent,
            COALESCE((SELECT MAX(o.created_at) FROM orders o JOIN users u ON o.user_id = u.id WHERE u.email = f.email), NULL) as last_purchase_date
          FROM farmers f
          ORDER BY f.name ASC
        `);

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

    const [[farmer]] = await db.execute('SELECT * FROM farmers WHERE id = ?', [req.params.id]);
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    
    // Get farmer's sales history only when the relation exists
    const [sales] = salesHasFarmerId
      ? await db.execute(`
          SELECT s.*, GROUP_CONCAT(CONCAT(p.name, ' (x', si.quantity, ')') SEPARATOR ', ') as items
          FROM sales s
          LEFT JOIN sale_items si ON s.id = si.sale_id
          LEFT JOIN products p ON si.product_id = p.id
          WHERE s.farmer_id = ?
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
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO farmers (name, phone, email, location, farm_size, crop_type, credit_limit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, email || null, location || null, farm_size || null, crop_type || null, credit_limit || 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Farmer added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update farmer
app.put('/api/farmers/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { name, phone, email, location, farm_size, crop_type, credit_limit, status } = req.body;

  try {
    const [result] = await db.execute(
      `UPDATE farmers SET name = ?, phone = ?, email = ?, location = ?, farm_size = ?, crop_type = ?, credit_limit = ?, status = ? WHERE id = ?`,
      [name, phone, email || null, location || null, farm_size || null, crop_type || null, credit_limit || 0, status || 'active', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Farmer not found' });
    res.json({ message: 'Farmer updated successfully' });
  } catch (err) {
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
    
    const [result] = await db.execute('DELETE FROM farmers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Farmer not found' });
    res.json({ message: 'Farmer deleted successfully' });
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
      ORDER BY quantity ASC
    `);
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
app.post('/api/orders', verifyToken, [
  body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
  body('shippingAddress').optional({ checkFalsy: true }).isString().trim().escape(),
  body('paymentMethod').optional({ checkFalsy: true }).isString().trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
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

    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)',
      [
        userId,
        orderNumber,
        totalAmount,
        shippingAddress !== undefined ? shippingAddress : null,
        paymentMethod !== undefined ? paymentMethod : null
      ]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.id, item.name, item.quantity, item.price, item.price * item.quantity]
      );
    }

    for (const item of items) {
      await connection.execute(
        'UPDATE products SET quantity = quantity - ? WHERE id = ?',
        [item.quantity, item.id]
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
    const [[order]] = await db.execute('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    res.json({ ...order, items });
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
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    const orders = rows.map(row => ({
      ...row,
      items: row.items_json ? JSON.parse(`[${row.items_json}]`) : []
    }));

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    params.push(orderId);

    const [result] = await db.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
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
  const { product_id, quantity } = req.body;
  const userId = req.user.id;

  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Product ID and valid quantity are required' });
  }

  try {
    const [[product]] = await db.execute('SELECT quantity FROM products WHERE id = ?', [product_id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient product quantity' });

    const [[existing]] = await db.execute('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, product_id]);

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > product.quantity) return res.status(400).json({ error: 'Total quantity exceeds available stock' });
      await db.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, existing.id]);
      res.json({ message: 'Cart item updated successfully' });
    } else {
      const [result] = await db.execute('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [
        userId,
        product_id,
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
    const [rows] = await db.execute('SELECT * FROM crops ORDER BY name');
    res.json(rows);
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
