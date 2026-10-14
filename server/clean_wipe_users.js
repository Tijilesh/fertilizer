const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function cleanWipe() {
  console.log('================================================================');
  console.log('🧹 COMPLETE CLEAN WIPE: RESETTING USERS & CUSTOM SHOPS');
  console.log('   (Preserving demo accounts: owner@example.com, admin@example.com)');
  console.log('================================================================\n');

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Root@123',
    database: process.env.DB_NAME || 'fertilizer_shop'
  });

  try {
    // 1. Identify users to wipe (all non-demo accounts)
    const [nonDemoUsers] = await db.execute(
      'SELECT id, username, email, role, shop_id FROM users WHERE email NOT IN ("owner@example.com", "admin@example.com")'
    );
    console.log(`Found ${nonDemoUsers.length} non-demo user(s) to remove:`);
    nonDemoUsers.forEach(u => console.log(`  - [ID: ${u.id}] ${u.username} (${u.email}) [Role: ${u.role}, Shop: ${u.shop_id}]`));

    // Disable foreign key checks during clean wipe to safely remove references
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');

    // 2. Clean cart items for non-demo users
    if (nonDemoUsers.length > 0) {
      const userIds = nonDemoUsers.map(u => u.id).join(',');
      const [cartRes] = await db.execute(`DELETE FROM cart_items WHERE user_id IN (${userIds})`);
      console.log(`✓ Removed ${cartRes.affectedRows} cart item(s)`);

      // 3. Remove orders & order items for these users
      const [orderRes] = await db.execute(`DELETE FROM orders WHERE user_id IN (${userIds})`);
      console.log(`✓ Removed ${orderRes.affectedRows} order(s)`);
    }

    // 4. Delete the non-demo users themselves
    const [userRes] = await db.execute(
      'DELETE FROM users WHERE email NOT IN ("owner@example.com", "admin@example.com")'
    );
    console.log(`✓ Deleted ${userRes.affectedRows} user account(s) from 'users' table`);

    // 5. Clean up non-default shops (e.g. shop_id = 16) and their associated data
    const [customShops] = await db.execute('SELECT id, name, slug FROM shops WHERE id != 1');
    console.log(`\nFound ${customShops.length} custom shop(s) to clean:`);
    customShops.forEach(s => console.log(`  - [ID: ${s.id}] ${s.name} (${s.slug})`));

    if (customShops.length > 0) {
      const shopIds = customShops.map(s => s.id).join(',');
      
      const tablesWithShopId = [
        'order_items', // via orders or direct
        'orders',
        'sales',
        'sale_items',
        'farmers',
        'products',
        'suppliers',
        'purchase_orders',
        'payments',
        'cash_drawer_transactions',
        'cash_drawer_sessions',
        'credit_reminders',
        'shop_settings'
      ];

      for (const tbl of tablesWithShopId) {
        try {
          const [delRes] = await db.execute(`DELETE FROM ${tbl} WHERE shop_id IN (${shopIds})`);
          if (delRes.affectedRows > 0) {
            console.log(`  ✓ Cleared ${delRes.affectedRows} row(s) from '${tbl}' for custom shops`);
          }
        } catch (e) {
          // ignore if table doesn't have shop_id
        }
      }

      const [shopDelRes] = await db.execute(`DELETE FROM shops WHERE id IN (${shopIds})`);
      console.log(`✓ Removed ${shopDelRes.affectedRows} custom shop(s) from 'shops' table`);
    }

    // 6. Delete all lingering email OTPs so users can register cleanly with fresh OTPs
    const [otpRes] = await db.execute('DELETE FROM email_otps');
    console.log(`✓ Cleared ${otpRes.affectedRows} old email OTP verification record(s)`);

    // Re-enable foreign key checks
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    // 7. Verify remaining users
    const [remainingUsers] = await db.execute('SELECT id, username, email, role, shop_id FROM users');
    console.log('\n================================================================');
    console.log('✅ CLEAN WIPE COMPLETE! Remaining users in database:');
    console.table(remainingUsers);
    console.log('================================================================');
    console.log('You can now navigate to /signup or /register and create a new account from scratch!');

  } catch (err) {
    console.error('Error during clean wipe:', err);
  } finally {
    await db.end();
  }
}

cleanWipe();
