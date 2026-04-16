import pool from "../db.js";

export const ensureNationalitiesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nationalities (
      id SERIAL PRIMARY KEY,
      nationality_name VARCHAR(255) NOT NULL UNIQUE,
      short_name VARCHAR(120),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getAllNationalities = async () => {
  await ensureNationalitiesTable();
  const r = await pool.query(
    `SELECT * FROM nationalities ORDER BY id ASC, nationality_name ASC`
  );
  return r.rows;
};

export const getNationalityById = async (id: number) => {
  await ensureNationalitiesTable();
  const r = await pool.query(`SELECT * FROM nationalities WHERE id = $1`, [id]);
  return r.rows[0];
};

export const createNationality = async (data: {
  nationality_name: string;
  short_name: string | null;
}) => {
  await ensureNationalitiesTable();
  const r = await pool.query(
    `INSERT INTO nationalities (nationality_name, short_name)
     VALUES ($1, $2)
     RETURNING *`,
    [data.nationality_name.trim(), data.short_name]
  );
  return r.rows[0];
};

export const updateNationality = async (
  id: number,
  data: { nationality_name: string; short_name: string | null }
) => {
  await ensureNationalitiesTable();
  const r = await pool.query(
    `UPDATE nationalities
     SET nationality_name = $1,
         short_name = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [data.nationality_name.trim(), data.short_name, id]
  );
  return r.rows[0];
};

export const deleteNationality = async (id: number) => {
  await ensureNationalitiesTable();
  const r = await pool.query(
    `DELETE FROM nationalities WHERE id = $1 RETURNING *`,
    [id]
  );
  return r.rows[0];
};

