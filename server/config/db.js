const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Only load .env if NOT running on Netlify
if (!process.env.NETLIFY) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

// For debugging in Netlify Function Logs
console.log('DB Connection Config:');
console.log('- Host:', process.env.DB_HOST);
console.log('- User:', process.env.DB_USER);
console.log('- Password Present:', !!(process.env.DB_PASS || process.env.BC_DB_PASSWORD));
console.log('- Password Length:', (process.env.DB_PASS || process.env.BC_DB_PASSWORD) ? (process.env.DB_PASS || process.env.BC_DB_PASSWORD).length : 0);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.BC_DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

// Use promise-based pool
const promisePool = pool.promise();

module.exports = promisePool;
