const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const http = require('http');

const PORT = 5016;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  const { spawn } = require('child_process');
  const server = spawn('node', ['index.js'], { env: { ...process.env, PORT: PORT } });
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  const db = await mysql.createConnection({
    host: '127.0.0.1', user: 'root', password: 'Root@123', database: 'fertilizer_shop'
  });

  console.log('--- Setting up Test Users ---');
  const ts = Date.now();
  const userAEmail = `usera_${ts}@test.com`;
  const userBEmail = `userb_${ts}@test.com`;
  const userAName = `User A ${ts}`;
  const userBName = `User B ${ts}`;

  const [resA] = await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [userAName, userAEmail, 'hashed', 'customer']);
  const tokenA = jwt.sign({ id: resA.insertId, email: userAEmail, role: 'customer' }, 'your-secret-key', { expiresIn: '1h' });

  const [resB] = await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [userBName, userBEmail, 'hashed', 'customer']);
  const tokenB = jwt.sign({ id: resB.insertId, email: userBEmail, role: 'customer' }, 'your-secret-key', { expiresIn: '1h' });

  console.log('\n--- Test 9 & 10: Open profile without farmer_id ---');
  let profileA = await request('GET', '/api/users/profile', null, tokenA);
  console.log('GET Profile A:', profileA.status, profileA.data.farmer_id === null ? 'No farmer_id' : 'FAIL');

  console.log('\n--- Test 1 & 5: Name + Email only (optional empty) ---');
  let update1 = await request('PUT', '/api/users/profile', {
    name: userAName, email: userAEmail, phone: '', location: '', farm_size: '', crop_type: ''
  }, tokenA);
  console.log('Update 1 status:', update1.status);

  console.log('\n--- Test 2: Add Phone ---');
  let phoneA = `999${ts.toString().slice(-7)}`;
  let update2 = await request('PUT', '/api/users/profile', {
    name: userAName, email: userAEmail, phone: phoneA, location: '', farm_size: '', crop_type: ''
  }, tokenA);
  console.log('Update 2 status:', update2.status);
  profileA = await request('GET', '/api/users/profile', null, tokenA);
  console.log('Farmer created?', profileA.data.farmer_id !== null);

  console.log('\n--- Test 3 & 4 & 8: Add other fields ---');
  let update3 = await request('PUT', '/api/users/profile', {
    name: userAName, email: userAEmail, phone: phoneA, location: 'Farmville', farm_size: '12.5', crop_type: 'Corn'
  }, tokenA);
  console.log('Update 3 status:', update3.status);

  console.log('\n--- Test 6: Clear an existing optional field ---');
  let update4 = await request('PUT', '/api/users/profile', {
    name: userAName, email: userAEmail, phone: phoneA, location: '', farm_size: '12.5', crop_type: 'Corn'
  }, tokenA);
  console.log('Update 4 status:', update4.status);

  console.log('\n--- Test 7: Duplicate phone handling ---');
  let phoneB = `888${ts.toString().slice(-7)}`;
  await request('PUT', '/api/users/profile', {
    name: userBName, email: userBEmail, phone: phoneB, location: '', farm_size: '', crop_type: ''
  }, tokenB);

  let update5 = await request('PUT', '/api/users/profile', {
    name: userBName, email: userBEmail, phone: phoneA, location: '', farm_size: '', crop_type: ''
  }, tokenB);
  console.log('Update 5 (duplicate phone) status:', update5.status);
  console.log('Error message:', update5.data.error);

  console.log('\n--- TESTS COMPLETED ---');
  server.kill();
  db.end();
}

runTests().catch(e => console.error(e));
