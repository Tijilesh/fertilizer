const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({host:'127.0.0.1', user:'root', password:'Root@123', database:'fertilizer_shop'});
  try {
    const safePhone = "7995654569";
    const name = "Kothagundla Nokesh";
    const safeEmail = "nokesh8919500709@g..."; // Note: truncated email might cause an issue? No, it's just a string.
    const location = "";
    const farm_size = "";
    const crop_type = "";
    const req = { user: { shop_id: 1, id: 1 } }; // Assuming shop_id 1
    
    const [result] = await c.execute(
      'INSERT INTO farmers (name, phone, email, location, farm_size, crop_type, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, safePhone, safeEmail, location || null, farm_size || null, crop_type || null, req.user.shop_id || 1]
    );
    console.log("Insert success!", result.insertId);
  } catch(e) {
    console.error("Insert Error:", e.message);
  }
  process.exit(0);
}
run();
