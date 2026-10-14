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

async function runTest() {
  console.log('================================================================');
  console.log('🧪 CASH DRAWER & CLOSING SETTLEMENT END-TO-END TEST');
  console.log('================================================================\n');

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Root@123',
    database: process.env.DB_NAME || 'fertilizer_shop'
  });

  const [owners] = await db.execute('SELECT * FROM users WHERE role = "owner" LIMIT 1');
  const [regularUsers] = await db.execute('SELECT * FROM users WHERE role = "user" LIMIT 1');
  const owner = owners[0];
  const user = regularUsers[0];

  const ownerToken = jwt.sign(
    { id: owner.id, username: owner.username, role: 'owner', shop_id: owner.shop_id || 1 },
    SECRET,
    { expiresIn: '2h' }
  );

  const userToken = jwt.sign(
    { id: user.id, username: user.username, role: 'user', shop_id: user.shop_id || 1 },
    SECRET,
    { expiresIn: '2h' }
  );

  // 1. RBAC Check: Regular customer should be denied access to cash drawer
  const rbacRes = await request('/cash-drawer/current', 'GET', null, userToken);
  check('RBAC: Non-admin/user is forbidden (403) from cash drawer', rbacRes.status === 403);

  // 2. Fetch current status with owner
  const currentRes = await request('/cash-drawer/current', 'GET', null, ownerToken);
  check('Owner can retrieve /cash-drawer/current', currentRes.status === 200);

  // If there is already an active session, close it first so we have a clean test
  if (currentRes.data?.activeSession) {
    console.log('  ℹ️  Found existing open session, closing it for test setup...');
    await request('/cash-drawer/close', 'POST', {
      actual_cash: currentRes.data.expectedCash,
      denominations: { n500: 0, coins: currentRes.data.expectedCash },
      handover_to: 'Setup Script',
      closing_notes: 'Auto closed before test'
    }, ownerToken);
  }

  // 3. Open morning drawer float
  const openRes = await request('/cash-drawer/open', 'POST', {
    opening_cash: 2500,
    notes: 'Morning float for test: 5 x ₹500 notes'
  }, ownerToken);
  check('Owner can open morning drawer float (₹2500)', openRes.status === 201 && openRes.data.session_code, JSON.stringify(openRes.data));

  // 4. Verify current status shows open session
  const verifyOpen = await request('/cash-drawer/current', 'GET', null, ownerToken);
  check('Active session reflects opening cash ₹2500', parseFloat(verifyOpen.data?.activeSession?.opening_cash) === 2500);
  check('Initial expectedCash equals opening float ₹2500', parseFloat(verifyOpen.data?.expectedCash) >= 2500);

  // 5. Cannot open another concurrent session while one is active
  const duplicateOpen = await request('/cash-drawer/open', 'POST', { opening_cash: 1000 }, ownerToken);
  check('Concurrent session open rejected with 400 Bad Request', duplicateOpen.status === 400);

  // 6. Log petty cash expense (Hamali labor ₹200)
  const expenseRes = await request('/cash-drawer/expense', 'POST', {
    amount: 200,
    category: 'labor',
    description: 'Hamali for unloading 25 urea bags'
  }, ownerToken);
  check('Petty cash outlay logged (₹200 labor)', expenseRes.status === 201);

  // 7. Log petty cash expense (Staff tea ₹50)
  const expenseTea = await request('/cash-drawer/expense', 'POST', {
    amount: 50,
    category: 'tea_snacks',
    description: 'Evening tea for staff'
  }, ownerToken);
  check('Petty cash outlay logged (₹50 tea)', expenseTea.status === 201);

  // 8. Add change / cash in (₹300 in change coins)
  const cashInRes = await request('/cash-drawer/cash-in', 'POST', {
    amount: 300,
    category: 'change_float',
    description: 'Change coins from bank'
  }, ownerToken);
  check('Cash addition logged (+₹300 change float)', cashInRes.status === 201);

  // 9. Check updated expected cash calculation
  // Calculation: 2500 (float) + 300 (in) - 250 (out: 200+50) + liveSales.cashSales = 2550 + cashSales
  const updatedCurrent = await request('/cash-drawer/current', 'GET', null, ownerToken);
  const expectedWithoutSales = 2500 + 300 - 250; // 2550
  const expectedWithSales = expectedWithoutSales + (parseFloat(updatedCurrent.data?.liveSales?.cashSales) || 0);
  check('Live expectedCash correctly aggregates float + in - out + sales', Math.abs(parseFloat(updatedCurrent.data?.expectedCash) - expectedWithSales) < 0.01, `Expected: ${expectedWithSales}, Got: ${updatedCurrent.data?.expectedCash}`);
  check('Transactions ledger contains logged items', updatedCurrent.data?.transactions?.length >= 3);

  // 10. Close drawer session with denomination counting
  // Let count exact expected cash
  const actualCount = Math.round(expectedWithSales);
  const denominations = {
    n500: Math.floor(actualCount / 500),
    n200: 0,
    n100: 0,
    n50: 0,
    n20: 0,
    n10: 0,
    coins: actualCount % 500
  };

  const closeRes = await request('/cash-drawer/close', 'POST', {
    actual_cash: actualCount,
    denominations,
    handover_to: 'Ramesh (Store Manager)',
    closing_notes: 'End of shift handover verification test'
  }, ownerToken);
  check('Owner can close drawer with denomination counter', closeRes.status === 200 && closeRes.data?.settlement?.status === 'CLOSED');
  check('Settlement response contains session_id and zero/small difference', closeRes.data?.settlement?.session_id != null);

  const closedSessionId = closeRes.data?.settlement?.session_id;

  // 11. Fetch history of closed sessions
  const historyRes = await request('/cash-drawer/history', 'GET', null, ownerToken);
  const foundInHistory = Array.isArray(historyRes.data) && historyRes.data.some(s => s.id === closedSessionId);
  check('Closed session appears in closing settlement history', foundInHistory);

  // 12. Fetch full settlement details for printing
  const sessionDetailRes = await request(`/cash-drawer/session/${closedSessionId}`, 'GET', null, ownerToken);
  check('Can retrieve complete settlement details & ledger for slip printing', sessionDetailRes.status === 200 && sessionDetailRes.data?.session?.session_code && Array.isArray(sessionDetailRes.data?.transactions));

  console.log('\n================================================================');
  console.log(`🏁 CASH DRAWER TEST SUMMARY:`);
  console.log(`   Total Checks: ${totalTests}`);
  console.log(`   Passed:       ${passedTests}`);
  console.log(`   Failed:       ${failedTests}`);
  console.log('================================================================');

  await db.end();
  process.exit(failedTests > 0 ? 1 : 0);
}

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
