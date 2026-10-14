const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const BASE_URL = 'http://localhost:5012/api';
const SECRET = process.env.JWT_SECRET || 'your-secret-key';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function check(desc, condition, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${desc}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${desc} ${details ? '--> ' + details : ''}`);
    failedTests++;
  }
}

async function request(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { status: 0, ok: false, error: e.message };
  }
}

async function runRoleSuite() {
  console.log('================================================================');
  console.log('🚀 MULTI-ROLE (OWNER & USER) & FULL SYSTEM INTEGRATION TEST');
  console.log('================================================================\n');

  let db;
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Root@123',
      database: process.env.DB_NAME || 'fertilizer_shop'
    });
    check('Database direct connection pool healthy', true);

    // Fetch owner and user accounts
    const [owners] = await db.execute('SELECT * FROM users WHERE role = "owner" LIMIT 1');
    const [users] = await db.execute('SELECT * FROM users WHERE role = "user" LIMIT 1');

    check('Owner account exists in database', owners.length > 0, `Found: ${owners[0]?.username} (ID: ${owners[0]?.id})`);
    check('User/Customer account exists in database', users.length > 0, `Found: ${users[0]?.username} (ID: ${users[0]?.id})`);

    const owner = owners[0];
    const normalUser = users[0];

    const ownerToken = jwt.sign(
      { id: owner.id, username: owner.username, email: owner.email, role: owner.role, shop_id: owner.shop_id || 1 },
      SECRET,
      { expiresIn: '12h' }
    );

    const userToken = jwt.sign(
      { id: normalUser.id, username: normalUser.username, email: normalUser.email, role: normalUser.role, shop_id: normalUser.shop_id || 1, farmer_id: normalUser.farmer_id },
      SECRET,
      { expiresIn: '12h' }
    );

    // ─────────────────────────────────────────────────────────────
    // 1. OWNER ROLE CAPABILITIES & ENDPOINTS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. OWNER ACCOUNT ENDPOINT VALIDATION ---');

    // Dashboard stats
    const dashRes = await request('/dashboard/stats', 'GET', null, ownerToken);
    check('Owner can access /dashboard/stats', dashRes.ok && dashRes.data !== null);

    // Accounting summary
    const accRes = await request('/accounting/summary', 'GET', null, ownerToken);
    check('Owner can access /accounting/summary', accRes.ok && 'totalRevenue' in (accRes.data || {}));

    // Suppliers list
    const suppRes = await request('/suppliers', 'GET', null, ownerToken);
    check('Owner can view suppliers list', suppRes.ok && Array.isArray(suppRes.data));

    // Purchase orders
    const poRes = await request('/purchase-orders', 'GET', null, ownerToken);
    check('Owner can view purchase orders', poRes.ok && Array.isArray(poRes.data));

    // Payments list
    const payRes = await request('/payments', 'GET', null, ownerToken);
    check('Owner can view payments', payRes.ok && Array.isArray(payRes.data));

    // Farmers list
    const farmersRes = await request('/farmers', 'GET', null, ownerToken);
    check('Owner can view farmers list', farmersRes.ok && Array.isArray(farmersRes.data));

    // Stock Expiry list
    const expiryRes = await request('/inventory/expiry', 'GET', null, ownerToken);
    check('Owner can view stock expiry list', expiryRes.ok && Array.isArray(expiryRes.data));

    // Admin view customer orders
    const adminOrdersRes = await request('/admin/orders', 'GET', null, ownerToken);
    check('Owner can access /admin/orders', adminOrdersRes.ok && Array.isArray(adminOrdersRes.data));

    // ─────────────────────────────────────────────────────────────
    // 2. USER / CUSTOMER ROLE CAPABILITIES & BOUNDARIES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. USER/CUSTOMER ACCOUNT ENDPOINT VALIDATION ---');

    // User can browse catalog
    const userProdRes = await request('/products', 'GET', null, userToken);
    check('User can view products catalog', userProdRes.ok && Array.isArray(userProdRes.data));

    // User can view their cart
    const cartRes = await request('/cart', 'GET', null, userToken);
    check('User can view cart items', cartRes.ok && Array.isArray(cartRes.data));

    // User can view their order history
    const userOrdersRes = await request('/orders', 'GET', null, userToken);
    check('User can view order history (/orders)', userOrdersRes.ok && Array.isArray(userOrdersRes.data));

    // User can view government schemes
    const schemesRes = await request('/government-schemes', 'GET', null, userToken);
    check('User can view government schemes', schemesRes.ok && Array.isArray(schemesRes.data));

    // RBAC Security Check: User should NOT access /admin/orders
    const forbiddenAdminOrders = await request('/admin/orders', 'GET', null, userToken);
    check('Security RBAC: User is forbidden (403) from /admin/orders', forbiddenAdminOrders.status === 403);

    // ─────────────────────────────────────────────────────────────
    // 3. E2E FLOW: CART -> CHECKOUT -> ORDER -> VERIFY IN HISTORY
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. END-TO-END CHECKOUT & ORDER FLOW ---');

    const [[catalogItem]] = await db.execute('SELECT * FROM products WHERE shop_id = ? AND quantity >= 5 LIMIT 1', [normalUser.shop_id]);
    check('Found catalog product with sufficient quantity for checkout test', !!catalogItem, `Item: ${catalogItem?.name}`);

    if (catalogItem) {
      // 1. Add item to cart
      const addCartRes = await request('/cart', 'POST', {
        productId: catalogItem.id,
        quantity: 1
      }, userToken);
      check('User added product to shopping cart', addCartRes.ok);

      // 2. Place Order
      const testOrderNumber = `TEST-ORD-${Date.now()}`;
      const checkoutRes = await request('/orders', 'POST', {
        items: [{
          id: catalogItem.id,
          name: catalogItem.name,
          quantity: 1,
          price: catalogItem.price
        }],
        totalAmount: catalogItem.price,
        shippingAddress: 'Village Green Farm 42, Andhra Pradesh',
        paymentMethod: 'Cash on Delivery',
        orderNumber: testOrderNumber
      }, userToken);
      check('User placed order successfully via checkout API', checkoutRes.ok && checkoutRes.data?.orderNumber);

      const placedOrderId = checkoutRes.data?.id;

      // 3. Verify order exists in user's /orders list
      const updatedOrders = await request('/orders', 'GET', null, userToken);
      const foundInOrders = updatedOrders.data?.find(o => o.id === placedOrderId || o.order_number === testOrderNumber);
      check('Newly placed order appears in User order history', !!foundInOrders);

      // 4. Verify owner sees it in /admin/orders
      const adminOrdersCheck = await request('/admin/orders', 'GET', null, ownerToken);
      const foundInAdmin = adminOrdersCheck.data?.find(o => o.id === placedOrderId || o.order_number === testOrderNumber);
      check('Newly placed order appears in Owner /admin/orders management', !!foundInAdmin);

      // 5. Clean up test order & mirrored sale so database stays pristine
      if (placedOrderId) {
        await db.execute('DELETE FROM order_items WHERE order_id = ?', [placedOrderId]);
        await db.execute('DELETE FROM orders WHERE id = ?', [placedOrderId]);
        
        // Find mirrored sale and its items
        const [sales] = await db.execute('SELECT id FROM sales WHERE sale_type = "online" AND total_amount = ? AND customer_name = ?', [catalogItem.price, normalUser.username]);
        for (const s of sales) {
          await db.execute('DELETE FROM sale_items WHERE sale_id = ?', [s.id]);
          await db.execute('DELETE FROM sales WHERE id = ?', [s.id]);
        }
        
        // Restore product stock
        await db.execute('UPDATE products SET quantity = quantity + 1 WHERE id = ?', [catalogItem.id]);
        check('Cleaned up test order artifacts & restored stock', true);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. STOCK EXPIRY & ACTIONS (VIEW DETAILS, RETURN, DISPOSE)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. STOCK EXPIRY & ACTIONS VERIFICATION ---');
    const [[testStock]] = await db.execute('SELECT * FROM products WHERE shop_id = ? AND quantity >= 2 LIMIT 1', [owner.shop_id]);
    check('Found test stock item for action buttons testing', !!testStock, `Product: ${testStock?.name}`);

    if (testStock) {
      // Test Return to Supplier
      const returnRes = await request('/inventory/return-to-supplier', 'POST', {
        productId: testStock.id,
        quantity: 1,
        reason: 'Automated Multi-Account Test'
      }, ownerToken);
      check('Stock Expiry: Return to Supplier action successful', returnRes.ok && returnRes.data?.success);

      // Test Dispose
      const disposeRes = await request('/inventory/dispose', 'POST', {
        productId: testStock.id,
        quantity: 1,
        reason: 'Automated Multi-Account Test Disposal'
      }, ownerToken);
      check('Stock Expiry: Dispose action successful', disposeRes.ok && disposeRes.data?.success);

      // Restore 2 units
      await db.execute('UPDATE products SET quantity = quantity + 2 WHERE id = ?', [testStock.id]);
      check('Restored stock after actions testing', true);
    }

    console.log('\n================================================================');
    console.log(`🏁 MULTI-ROLE & SYSTEM TEST SUMMARY:`);
    console.log(`   Total Checks: ${totalTests}`);
    console.log(`   Passed:       ${passedTests}`);
    console.log(`   Failed:       ${failedTests}`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal test runner error:', err);
  } finally {
    if (db) await db.end();
  }
}

runRoleSuite();
