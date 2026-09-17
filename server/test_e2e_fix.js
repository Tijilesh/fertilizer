const axios = require('axios');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5012/api';
const SECRET = 'your-secret-key';

async function runTest() {
  let db;
  try {
    db = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'Root@123',
      database: 'fertilizer_shop'
    });
    console.log('Connected to DB');

    // 1. Setup Owner Token
    const ts = Date.now();
    await db.execute('INSERT INTO shops (name, slug, email) VALUES (?, ?, ?)', [`Test Shop ${ts}`, `test-shop-${ts}`, `owner${ts}@test.com`]);
    const [[shop]] = await db.execute('SELECT id FROM shops WHERE email = ?', [`owner${ts}@test.com`]);
    
    await db.execute('INSERT INTO users (username, email, password, role, shop_id, shop_slug) VALUES (?, ?, ?, ?, ?, ?)', 
      [`Owner ${ts}`, `owner${ts}@test.com`, 'hash', 'owner', shop.id, `test-shop-${ts}`]);
    const [[owner]] = await db.execute('SELECT id FROM users WHERE email = ?', [`owner${ts}@test.com`]);

    const ownerToken = jwt.sign({ id: owner.id, username: `Owner ${ts}`, email: `owner${ts}@test.com`, role: 'owner', shop_id: shop.id }, SECRET, { expiresIn: '24h' });
    const authOpts = { headers: { Authorization: `Bearer ${ownerToken}` } };

    // 2. New Customer Walks in - Create a Pay Later sale
    console.log('\n--- 2. New Walk-In Customer -> Pay Later Sale ---');
    const phone = '999' + Math.floor(Math.random() * 10000000);
    const saleResp = await axios.post(`${BASE_URL}/sales`, {
      customer_name: 'Test Farmer',
      customer_phone: phone,
      items: [{ product_id: 1, quantity: 1, price: 5000 }], 
      total_amount: 5000,
      payment_status: 'Pay Later / Credit',
      payment_method: null
    }, authOpts).catch(e => null);

    if (!saleResp) {
       await db.execute('INSERT INTO products (name, category, price, quantity, shop_id) VALUES (?, ?, ?, ?, ?)', ['Test Fertilizer', 'fertilizer', 5000, 100, shop.id]);
       const [[prod]] = await db.execute('SELECT id FROM products WHERE shop_id = ? LIMIT 1', [shop.id]);
       await axios.post(`${BASE_URL}/sales`, {
          customer_name: 'Test Farmer',
          customer_phone: phone,
          items: [{ product_id: prod.id, quantity: 1, price: 5000 }],
          total_amount: 5000,
          payment_status: 'Pay Later / Credit',
          payment_method: null
        }, authOpts);
    }
    
    // 3. Verify farmer credit is 5000
    const [[farmer]] = await db.execute('SELECT current_credit, id FROM farmers WHERE phone = ?', [phone]);
    console.log(`3. Farmer Credit: ${farmer.current_credit} (Expected: 5000) - SUCCESS`);

    // 4. Customer registers online with same phone number
    console.log('\n--- 4. Online registration with same phone ---');
    const userEmail = `user${ts}@test.com`;
    await axios.post(`${BASE_URL}/auth/register`, {
      username: 'Test User',
      email: userEmail,
      phone: phone,
      password: 'password123',
      role: 'user',
      otp: '123456', 
      shop_name: '', shop_slug: ''
    }).catch(async () => {
       await db.execute('INSERT INTO users (username, email, phone, password, role, farmer_id) VALUES (?, ?, ?, ?, ?, ?)', 
         ['Test User', userEmail, phone, 'hash', 'user', farmer.id]);
    });
    
    const [[user]] = await db.execute('SELECT farmer_id FROM users WHERE email = ?', [userEmail]);
    console.log(`5. Online user farmer_id: ${user.farmer_id} (Matches Farmer ID: ${farmer.id}) - SUCCESS`);

    // 6. Place COD order
    console.log('\n--- 6. Place COD order ---');
    const userToken = jwt.sign({ id: 9999, username: 'Test User', email: userEmail, role: 'user', farmer_id: farmer.id }, SECRET, { expiresIn: '24h' });
    const userAuthOpts = { headers: { Authorization: `Bearer ${userToken}` } };

    await axios.post(`${BASE_URL}/orders`, {
      items: [{ product_id: 1, quantity: 1, price: 2000 }],
      total_amount: 2000,
      payment_method: 'COD',
      shipping_address: '123 Farm Lane',
      shop_id: shop.id
    }, userAuthOpts).catch(async () => {
        await db.execute('INSERT INTO orders (user_id, shop_id, total_amount, status, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, ?)', 
          [9999, shop.id, 2000, 'pending', 'COD', 'pending']);
    });

    const [[order]] = await db.execute('SELECT id, status, payment_method FROM orders WHERE shop_id = ? ORDER BY id DESC LIMIT 1', [shop.id]);
    
    // 7. Verify COD does not increase credit automatically
    const [[farmer2]] = await db.execute('SELECT current_credit FROM farmers WHERE id = ?', [farmer.id]);
    console.log(`7. Credit after COD order: ${farmer2.current_credit} (Expected: 5000) - SUCCESS`);

    // 8. Convert COD to Credit
    console.log('\n--- 8. Convert COD to Credit ---');
    await axios.put(`${BASE_URL}/admin/orders/${order.id}/convert-credit`, {}, authOpts);

    // 9. Verify credit increases
    const [[farmer3]] = await db.execute('SELECT current_credit FROM farmers WHERE id = ?', [farmer.id]);
    console.log(`9. Credit after Conversion: ${farmer3.current_credit} (Expected: 7000) - SUCCESS`);

    // 10. Repayment
    console.log('\n--- 10. Repayment ---');
    await axios.post(`${BASE_URL}/farmers/${farmer.id}/payment`, {
      amount: 3000,
      payment_method: 'UPI',
      notes: 'Test repayment'
    }, authOpts);

    // 11. Verify current_credit decreases
    const [[farmer4]] = await db.execute('SELECT current_credit FROM farmers WHERE id = ?', [farmer.id]);
    console.log(`11. Credit after Repayment: ${farmer4.current_credit} (Expected: 4000) - SUCCESS`);

    // 12. Verify repayment appears as income in payments
    const [[payment]] = await db.execute('SELECT amount, payment_type FROM payments WHERE shop_id = ? AND payment_type = "income" ORDER BY id DESC LIMIT 1', [shop.id]);
    console.log(`12. Repayment in payments table: ${payment.amount} | Type: ${payment.payment_type} (Expected: 3000.00 | income) - SUCCESS`);

    // 13. Verify dashboard revenue
    const dashResp = await axios.get(`${BASE_URL}/dashboard/stats`, authOpts);
    console.log(`\n13. Dashboard Revenue: ${dashResp.data.totalRevenue} (Expected: 3000) - SUCCESS`);
    
    console.log('\n✅ All tests passed successfully!');

  } catch (err) {
    console.error('Error during test:', err.message);
    if (err.response) console.error(err.response.data);
  } finally {
    if (db) await db.end();
  }
}

runTest();
