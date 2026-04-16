import pool from "../db.js";

export const ensurePositionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      position_code VARCHAR(80) NOT NULL,
      position_title VARCHAR(255) NOT NULL,
      short_name VARCHAR(120),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (position_code)
    )
  `);
};

export const getAllPositions = async () => {
  await ensurePositionsTable();
  const r = await pool.query(`
    SELECT * FROM positions
    ORDER BY position_title ASC, position_code ASC
  `);
  return r.rows;
};

export const getPositionById = async (id: number) => {
  await ensurePositionsTable();
  const r = await pool.query("SELECT * FROM positions WHERE id = $1", [id]);
  return r.rows[0];
};

export const createPosition = async (data: {
  position_code: string;
  position_title: string;
  short_name: string | null;
}) => {
  await ensurePositionsTable();
  const r = await pool.query(
    `INSERT INTO positions (position_code, position_title, short_name)
     VALUES ($1, $2, $3) RETURNING *`,
    [
      data.position_code.trim(),
      data.position_title.trim(),
      data.short_name?.trim() || null,
    ]
  );
  return r.rows[0];
};

export const updatePosition = async (
  id: number,
  data: {
    position_code: string;
    position_title: string;
    short_name: string | null;
  }
) => {
  await ensurePositionsTable();
  const r = await pool.query(
    `UPDATE positions SET
      position_code = $1, position_title = $2, short_name = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 RETURNING *`,
    [
      data.position_code.trim(),
      data.position_title.trim(),
      data.short_name?.trim() || null,
      id,
    ]
  );
  return r.rows[0];
};

export const deletePosition = async (id: number) => {
  await ensurePositionsTable();
  const r = await pool.query(
    "DELETE FROM positions WHERE id = $1 RETURNING *",
    [id]
  );
  return r.rows[0];
};
