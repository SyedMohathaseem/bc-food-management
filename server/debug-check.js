const db = require('./config/db');
const http = require('http');

async function check() {
  console.log('--- START DIAGNOSTIC ---');
  
  // 1. Check DB Connection
  try {
    const [rows] = await db.query('SELECT 1 as val');
    console.log('DB Connection: OK', rows);
  } catch (e) {
    console.error('DB Connection: FAILED', e.message);
    return;
  }

  // 2. Check Table Invoices
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM invoices');
    console.log('Table `invoices` Columns:');
    cols.forEach(c => console.log(` - ${c.Field} (${c.Type})`));
  } catch (e) {
    console.error('Check Table: FAILED', e.message);
  }

  // 3. Test API via HTTP
  console.log('Testing API GET /api/invoices?status=pending ...');
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/invoices?status=pending',
    method: 'GET'
  }, (res) => {
    console.log(`API Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('API Response:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
      process.exit(0);
    });
  });
  
  req.on('error', (e) => {
    console.error('API Request: FAILED', e.message);
    process.exit(1);
  });
  
  req.end();
}

check();
