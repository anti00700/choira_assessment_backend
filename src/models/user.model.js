const { pool } = require('../config/mysql');

const SAFE_COLUMNS = 'id, name, email, created_at, updated_at';

const toUser = (row) =>
  row && {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

async function findById(id) {
  const [rows] = await pool.execute(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`, [id]);
  return toUser(rows[0]) || null;
}

async function findByEmail(email) {
  const [rows] = await pool.execute(`SELECT ${SAFE_COLUMNS} FROM users WHERE email = ?`, [email]);
  return toUser(rows[0]) || null;
}

async function findByEmailWithPassword(email) {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS}, password_hash FROM users WHERE email = ?`,
    [email]
  );
  if (!rows[0]) return null;
  return { ...toUser(rows[0]), passwordHash: rows[0].password_hash };
}

async function findByIdWithPassword(id) {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS}, password_hash FROM users WHERE id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  return { ...toUser(rows[0]), passwordHash: rows[0].password_hash };
}

async function create({ name, email, passwordHash }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );
  return result.insertId;
}

const UPDATABLE = { name: 'name', email: 'email', passwordHash: 'password_hash' };

async function update(id, fields) {
  const keys = Object.keys(fields).filter((k) => UPDATABLE[k] && fields[k] !== undefined);
  if (keys.length === 0) return;

  const setClause = keys.map((k) => `${UPDATABLE[k]} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);
  await pool.execute(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);
}

module.exports = { findById, findByEmail, findByEmailWithPassword, findByIdWithPassword, create, update };
