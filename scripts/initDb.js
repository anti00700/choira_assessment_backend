/**
 * Creates the MySQL database (if missing) and runs sql/schema.sql.
 * Safe to run multiple times (CREATE ... IF NOT EXISTS).
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config/env');

(async () => {
  const { host, port, user, password, database } = config.mysql;

  // Database names can't be parameterised, so whitelist the characters.
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error('MYSQL_DATABASE may only contain letters, numbers and underscores');
  }

  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${database}\``);

  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
  await conn.query(sql);
  await conn.end();

  console.log(`MySQL database "${database}" is ready (users, projects tables created).`);
})().catch((err) => {
  console.error('Database initialisation failed:', err.message);
  process.exit(1);
});
