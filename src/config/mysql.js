const fs = require('fs');
const mysql = require('mysql2/promise');
const config = require('./env');

const ssl = process.env.MYSQL_SSL_CA_PATH
  ? {
      ca: fs.readFileSync(process.env.MYSQL_SSL_CA_PATH),
      rejectUnauthorized: true,
    }
  : process.env.MYSQL_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined;

const pool = mysql.createPool({
  ...config.mysql,
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

async function connectMySQL() {
  await pool.query('SELECT 1');
  console.log('MySQL connected');
}

module.exports = { pool, connectMySQL };
