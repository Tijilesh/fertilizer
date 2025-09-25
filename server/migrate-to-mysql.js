require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');

async function migrateData() {
  // SQLite connection
  const sqliteDb = new sqlite3.Database('./fertilizer_shop.db');

  // MySQL connection
  const mysqlDb = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fertilizer_shop'
  });

  try {
    console.log('Starting migration from SQLite to MySQL...');

    // Migrate users
    console.log('Migrating users...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const user of users) {
      await mysqlDb.execute(
        'INSERT INTO users (id, username, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
        [user.id, user.username, user.email, user.password, user.role, user.created_at]
      );
    }
    console.log(`Migrated ${users.length} users`);

    // Migrate products
    console.log('Migrating products...');
    const products = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM products', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const product of products) {
      await mysqlDb.execute(
        'INSERT INTO products (id, name, type, price, quantity, supplier, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
        [product.id, product.name, product.type, product.price, product.quantity, product.supplier, product.description, product.created_at, product.updated_at]
      );
    }
    console.log(`Migrated ${products.length} products`);

    // Migrate sales
    console.log('Migrating sales...');
    const sales = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM sales', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const sale of sales) {
      await mysqlDb.execute(
        'INSERT INTO sales (id, customer_name, customer_phone, total_amount, sale_date) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
        [sale.id, sale.customer_name, sale.customer_phone, sale.total_amount, sale.sale_date]
      );
    }
    console.log(`Migrated ${sales.length} sales`);

    // Migrate sale_items
    console.log('Migrating sale items...');
    const saleItems = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM sale_items', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const item of saleItems) {
      await mysqlDb.execute(
        'INSERT INTO sale_items (id, sale_id, product_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
        [item.id, item.sale_id, item.product_id, item.quantity, item.price_per_unit, item.total_price]
      );
    }
    console.log(`Migrated ${saleItems.length} sale items`);

    // Migrate orders
    console.log('Migrating orders...');
    const orders = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM orders', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const order of orders) {
      await mysqlDb.execute(
        'INSERT INTO orders (id, user_id, order_number, total_amount, status, shipping_address, payment_method, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
        [order.id, order.user_id, order.order_number, order.total_amount, order.status, order.shipping_address, order.payment_method, order.created_at, order.updated_at]
      );
    }
    console.log(`Migrated ${orders.length} orders`);

    // Migrate order_items
    console.log('Migrating order items...');
    const orderItems = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM order_items', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const item of orderItems) {
      await mysqlDb.execute(
        'INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
        [item.id, item.order_id, item.product_id, item.product_name, item.quantity, item.price_per_unit, item.total_price]
      );
    }
    console.log(`Migrated ${orderItems.length} order items`);

    // Migrate cart_items
    console.log('Migrating cart items...');
    const cartItems = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM cart_items', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const item of cartItems) {
      await mysqlDb.execute(
        'INSERT INTO cart_items (id, user_id, product_id, quantity, added_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
        [item.id, item.user_id, item.product_id, item.quantity, item.added_at]
      );
    }
    console.log(`Migrated ${cartItems.length} cart items`);

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqliteDb.close();
    await mysqlDb.end();
  }
}

migrateData();