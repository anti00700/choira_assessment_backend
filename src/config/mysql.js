const mysql = require('mysql2/promise');
const config = require('./env');

// Reuse connections across requests.
const pool = mysql.createPool({
  ...config.mysql,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

async function connectMySQL() {
  await pool.query('SELECT 1');
  console.log('MySQL connected');
}

module.exports = { pool, connectMySQL };
