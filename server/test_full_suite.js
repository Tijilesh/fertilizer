const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const BASE_URL = 'http://localhost:5012/api';
const SECRET = process.env.JWT_SECRET || 'your-secret-key';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

async function api(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runFullTest() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE FULL PROJECT SYSTEM TEST');
  console.log('====================================================\n');

  let db;
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Root@123',
      database: process.env.DB_NAME || 'fertilizer_shop'
    });
    assert(true, 'Connected to MySQL database directly');

    // 1. Health check / server running check
    console.log('\n--- 1. Testing Server Connectivity & Authentication ---');
    const [[user]] = await db.execute('SELECT * FROM users WHERE role IN ("admin", "owner") LIMIT 1');
    assert(!!user, `Found test admin/owner user (id: ${user?.id}, username: ${user?.username})`);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, shop_id: user.shop_id || 1 },
      SECRET,
      { expiresIn: '24h' }
    );

    // 2. Test Products & Inventory APIs
    console.log('\n--- 2. Testing Products & Inventory Endpoints ---');
    const prodRes = await api('/products', 'GET', null, token);
    assert(prodRes.ok && Array.isArray(prodRes.data) && prodRes.data.length > 0, `Fetched ${prodRes.data?.length || 0} products successfully`);

    // 3. Test Stock Expiry & Details API
    console.log('\n--- 3. Testing Stock Expiry Management ---');
    const expiryRes = await api('/inventory/expiry', 'GET', null, token);
    assert(expiryRes.ok && Array.isArray(expiryRes.data), `Fetched ${expiryRes.data?.length || 0} expiry items`);
    if (expiryRes.data.length > 0) {
      const item = expiryRes.data[0];
      assert('productName' in item && 'batchNumber' in item && 'cost' in item, 'Expiry items contain rich fields (productName, batchNumber, cost, status)');
    }

    // 4. Test Return to Supplier and Dispose Endpoints
    console.log('\n--- 4. Testing Return to Supplier & Disposal Actions ---');
    const testProd = prodRes.data[0];
    const initialQty = testProd.quantity;

    // Test Return to Supplier (1 unit)
    const returnRes = await api('/inventory/return-to-supplier', 'POST', {
      productId: testProd.id,
      quantity: 1,
      reason: 'Automated Test Return',
      notes: 'Test note'
    }, token);
    assert(returnRes.ok && returnRes.data.success, `Successfully returned 1 unit to supplier: ${returnRes.data?.message}`);

    // Test Disposal (1 unit)
    const disposeRes = await api('/inventory/dispose', 'POST', {
      productId: testProd.id,
      quantity: 1,
      reason: 'Automated Test Disposal',
      notes: 'Disposal test'
    }, token);
    assert(disposeRes.ok && disposeRes.data.success, `Successfully disposed 1 unit: ${disposeRes.data?.message}`);

    // Restore the 2 units so test is non-destructive
    await db.execute('UPDATE products SET quantity = ? WHERE id = ?', [initialQty, testProd.id]);
    assert(true, `Restored test product original quantity to ${initialQty}`);

    // 5. Test Farmers API & Walk-in vs Online Separation
    console.log('\n--- 5. Testing Farmer Details & Purchase History Separation ---');
    const [[farmer]] = await db.execute('SELECT * FROM farmers LIMIT 1');
    assert(!!farmer, `Found farmer for test (id: ${farmer?.id}, name: ${farmer?.name})`);

    const farmerRes = await api(`/farmers/${farmer.id}`, 'GET', null, token);
    assert(farmerRes.ok, `Retrieved farmer details for farmer ID ${farmer.id}`);
    assert(Array.isArray(farmerRes.data.sales), `Farmer response contains sales array (${farmerRes.data.sales.length} records)`);
    assert(Array.isArray(farmerRes.data.onlineOrders), `Farmer response contains onlineOrders array (${farmerRes.data.onlineOrders.length} records)`);

    // Verify no sales in sales[] have sale_type = 'online'
    const onlineSalesLeaking = farmerRes.data.sales.filter(s => s.sale_type === 'online');
    assert(onlineSalesLeaking.length === 0, `Verified zero online sales leaking into in-store walk-in sales array`);

    // 6. Test Suppliers Management API
    console.log('\n--- 6. Testing Suppliers & Credit Balance ---');
    const suppRes = await api('/suppliers', 'GET', null, token);
    assert(suppRes.ok && Array.isArray(suppRes.data), `Fetched ${suppRes.data?.length || 0} suppliers`);

    // 7. Test Orders Management API
    console.log('\n--- 7. Testing Online Orders Management ---');
    const ordersRes = await api('/admin/orders', 'GET', null, token);
    assert(ordersRes.ok && Array.isArray(ordersRes.data), `Fetched ${ordersRes.data?.length || 0} customer orders`);

    console.log('\n====================================================');
    console.log(`🎉 ALL TESTS COMPLETED! Passed: ${passed}, Failed: ${failed}`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Test execution failed with error:', err.message);
  } finally {
    if (db) await db.end();
  }
}

runFullTest();
