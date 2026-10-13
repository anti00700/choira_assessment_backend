const { pool } = require('../config/mysql');

const COLUMNS = 'id, user_id, name, description, status, created_at, updated_at';

const toProject = (row) =>
  row && {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

async function create({ userId, name, description, status }) {
  const [result] = await pool.execute(
    'INSERT INTO projects (user_id, name, description, status) VALUES (?, ?, ?, ?)',
    [userId, name, description ?? null, status]
  );
  return result.insertId;
}

async function findAllByUser(userId, { status } = {}) {
  let sql = `SELECT ${COLUMNS} FROM projects WHERE user_id = ?`;
  const params = [userId];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC, id DESC';
  const [rows] = await pool.execute(sql, params);
  return rows.map(toProject);
}

async function findByIdForUser(id, userId) {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS} FROM projects WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return toProject(rows[0]) || null;
}

const UPDATABLE = ['name', 'description', 'status'];

async function update(id, userId, fields) {
  const keys = UPDATABLE.filter((k) => fields[k] !== undefined);
  if (keys.length === 0) return;

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);
  await pool.execute(`UPDATE projects SET ${setClause} WHERE id = ? AND user_id = ?`, [
    ...values,
    id,
    userId,
  ]);
}

async function remove(id, userId) {
  const [result] = await pool.execute('DELETE FROM projects WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows > 0;
}

async function getStatsByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*)                          AS total,
       COALESCE(SUM(status = 'active'), 0)    AS active,
       COALESCE(SUM(status = 'completed'), 0) AS completed
     FROM projects
     WHERE user_id = ?`,
    [userId]
  );
  return {
    total: Number(rows[0].total),
    active: Number(rows[0].active),
    completed: Number(rows[0].completed),
  };
}

module.exports = { create, findAllByUser, findByIdForUser, update, remove, getStatsByUser };
