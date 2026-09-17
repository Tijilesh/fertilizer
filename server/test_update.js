const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({host:'127.0.0.1', user:'root', password:'Root@123', database:'fertilizer_shop'});
  try {
    const safePhone = "7995654569";
    const user = { farmer_id: 1 };
    
    // Check what the actual id of the farmer for phone 7995654569 is
    const [rows] = await c.execute('SELECT id FROM farmers WHERE phone = ?', [safePhone]);
    console.log("Existing farmers with this phone:", rows);

    // If there is another farmer with this phone, it would throw "This phone number is already associated with another farmer."
    // Let's test the update
    if (rows.length > 0 && rows[0].id !== user.farmer_id) {
       console.log("Error: This phone number is already associated with another farmer.");
    } else {
       await c.execute(
        'UPDATE farmers SET name = ?, phone = ?, email = ?, location = ?, farm_size = ?, crop_type = ? WHERE id = ?',
        ['Kothagundla Nokesh', safePhone, 'nokesh8919500709@g...', null, null, null, rows.length > 0 ? rows[0].id : 1]
      );
      console.log("Update success!");
    }
  } catch(e) {
    console.error("Update Error:", e.message);
  }
  process.exit(0);
}
run();
