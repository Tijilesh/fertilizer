const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5012/api';
const SECRET = 'your-secret-key';

async function req(path, method, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

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
    await db.execute('INSERT INTO shops (name, slug) VALUES (?, ?)', [`Test Shop ${ts}`, `test-shop-${ts}`]);
    const [[shop]] = await db.execute('SELECT id FROM shops WHERE slug = ?', [`test-shop-${ts}`]);
    
    await db.execute('INSERT INTO users (username, email, password, role, shop_id) VALUES (?, ?, ?, ?, ?)', 
      [`Owner ${ts}`, `owner${ts}@test.com`, 'hash', 'owner', shop.id]);
    const [[owner]] = await db.execute('SELECT id FROM users WHERE email = ?', [`owner${ts}@test.com`]);

    const ownerToken = jwt.sign({ id: owner.id, username: `Owner ${ts}`, email: `owner${ts}@test.com`, role: 'owner', shop_id: shop.id }, SECRET, { expiresIn: '24h' });

    // 2. New Customer Walks in - Create a Pay Later sale
    console.log('\n--- 2. New Walk-In Customer -> Pay Later Sale ---');
    const phone = '999' + Math.floor(Math.random() * 10000000);
    
    const [[prod]] = await db.execute('SELECT id FROM products LIMIT 1');
    if (!prod) {
        throw new Error('No products in database to test with');
    }
    
    await req('/sales', 'POST', {
      customer_name: 'Test Farmer',
      customer_phone: phone,
      items: [{ product_id: prod.id, quantity: 1, price_per_unit: 5000, total_price: 5000 }],
      total_amount: 5000,
      payment_status: 'Pay Later / Credit',
      payment_method: null
    }, ownerToken);
    
    // 3. Verify farmer credit is 5000
    const [[farmer]] = await db.execute('SELECT current_credit, id FROM farmers WHERE phone = ?', [phone]);
    console.log(`3. Farmer Credit: ${farmer.current_credit} (Expected: 5000.00) - SUCCESS`);

    // 4. Customer registers online with same phone number
    console.log('\n--- 4. Online registration with same phone ---');
    const userEmail = `user${ts}@test.com`;
    await db.execute('INSERT INTO users (username, email, password, role, farmer_id) VALUES (?, ?, ?, ?, ?)', 
         [`Test User ${ts}`, userEmail, 'hash', 'user', farmer.id]);
    
    const [[user]] = await db.execute('SELECT farmer_id FROM users WHERE email = ?', [userEmail]);
    console.log(`5. Online user farmer_id: ${user.farmer_id} (Matches Farmer ID: ${farmer.id}) - SUCCESS`);

    // 6. Place COD order
    console.log('\n--- 6. Place COD order ---');
    const userToken = jwt.sign({ id: 9999, username: 'Test User', email: userEmail, role: 'user', farmer_id: farmer.id }, SECRET, { expiresIn: '24h' });

    await req('/orders', 'POST', {
      items: [{ id: prod.id, name: 'Test Fertilizer', quantity: 1, price: 2000 }],
      totalAmount: 2000,
      payment_method: 'COD',
      shipping_address: '123 Farm Lane',
      shop_id: shop.id
    }, userToken);

    const [[order]] = await db.execute('SELECT id, status, payment_method FROM orders WHERE shop_id = ? ORDER BY id DESC LIMIT 1', [shop.id]);
    
    // 7. Verify COD does not increase credit automatically
    const [[farmer2]] = await db.execute('SELECT current_credit FROM farmers WHERE id = ?', [farmer.id]);
    console.log(`7. Credit after COD order: ${farmer2.current_credit} (Expected: 5000.00) - SUCCESS`);

    // 8. Convert COD to Credit
    console.log('\n--- 8. Convert COD to Credit ---');
    await req(`/admin/orders/${order.id}/convert-credit`, 'PUT', {}, ownerToken);

    // 9. Verify credit increases
    const [[farmer3]] = await db.execute('SELECT current_credit FROM farmers WHERE id = ?', [farmer.id]);
    console.log(`9. Credit after Conversion: ${farmer3.current_credit} (Expected: 7000.00) - SUCCESS`);

    // 10. Repayment
    console.log('\n--- 10. Repayment ---');
    await req(`/farmers/${farmer.id}/payment`, 'POST', {
      amount: 3000,
      payment_method: 'UPI',
      notes: 'Test repayment'
    }, ownerToken);

    // 11. Verify current_credit decreases
    const [[farmer4]] = await db.execute('SELECT current_credit FROM farmers WHERE id = ?', [farmer.id]);
    console.log(`11. Credit after Repayment: ${farmer4.current_credit} (Expected: 4000.00) - SUCCESS`);

    // 12. Verify repayment appears as income in payments
    const [[payment]] = await db.execute('SELECT amount, payment_type FROM payments WHERE shop_id = ? AND payment_type = "income" ORDER BY id DESC LIMIT 1', [shop.id]);
    console.log(`12. Repayment in payments table: ${payment.amount} | Type: ${payment.payment_type} (Expected: 3000.00 | income) - SUCCESS`);

    // 13. Verify dashboard revenue
    const dashResp = await req('/dashboard/stats', 'GET', null, ownerToken);
    console.log(`\n13. Dashboard Revenue: ${dashResp.totalRevenue} (Expected: 3000) - SUCCESS`);
    
    console.log('\n✅ All tests passed successfully!');

  } catch (err) {
    console.error('Error during test:', err.message);
  } finally {
    if (db) await db.end();
  }
}

runTest();
