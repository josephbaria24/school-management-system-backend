import pool from "../db.js";

export const ensureReligionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS religions (
      id SERIAL PRIMARY KEY,
      religion_name VARCHAR(255) NOT NULL UNIQUE,
      short_name VARCHAR(120),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getAllReligions = async () => {
  await ensureReligionsTable();
  const r = await pool.query(
    `SELECT * FROM religions ORDER BY id ASC, religion_name ASC`
  );
  return r.rows;
};

export const getReligionById = async (id: number) => {
  await ensureReligionsTable();
  const r = await pool.query(`SELECT * FROM religions WHERE id = $1`, [id]);
  return r.rows[0];
};

export const createReligion = async (data: {
  religion_name: string;
  short_name: string | null;
}) => {
  await ensureReligionsTable();
  const r = await pool.query(
    `INSERT INTO religions (religion_name, short_name)
     VALUES ($1, $2)
     RETURNING *`,
    [data.religion_name.trim(), data.short_name]
  );
  return r.rows[0];
};

export const updateReligion = async (
  id: number,
  data: { religion_name: string; short_name: string | null }
) => {
  await ensureReligionsTable();
  const r = await pool.query(
    `UPDATE religions
     SET religion_name = $1,
         short_name = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [data.religion_name.trim(), data.short_name, id]
  );
  return r.rows[0];
};

export const deleteReligion = async (id: number) => {
  await ensureReligionsTable();
  const r = await pool.query(`DELETE FROM religions WHERE id = $1 RETURNING *`, [
    id,
  ]);
  return r.rows[0];
};

