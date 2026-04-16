import pool from "../db.js";
import { ensureMajorDisciplineGroupsTable } from "./majorDisciplineGroups.service.js";

export const ensureChedMajorDisciplinesTable = async () => {
  await ensureMajorDisciplineGroupsTable();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ched_major_disciplines (
      id SERIAL PRIMARY KEY,
      major_code VARCHAR(20) NOT NULL UNIQUE,
      major_discipline VARCHAR(255) NOT NULL,
      major_group_id INTEGER NOT NULL REFERENCES major_discipline_groups(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    INSERT INTO ched_major_disciplines (major_code, major_discipline, major_group_id)
    SELECT '001007', 'Letters', g.id FROM major_discipline_groups g WHERE g.group_code = '0'
    ON CONFLICT (major_code) DO NOTHING
  `);
};

export const getAllChedMajorDisciplines = async () => {
  await ensureChedMajorDisciplinesTable();
  const r = await pool.query(`
    SELECT d.*, g.group_code, g.group_description
    FROM ched_major_disciplines d
    JOIN major_discipline_groups g ON d.major_group_id = g.id
    ORDER BY g.group_code ASC, d.major_code ASC
  `);
  return r.rows;
};

export const createChedMajorDiscipline = async (data: {
  major_code: string;
  major_discipline: string;
  major_group_id: number;
}) => {
  await ensureChedMajorDisciplinesTable();
  const r = await pool.query(
    `INSERT INTO ched_major_disciplines (major_code, major_discipline, major_group_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [data.major_code.trim(), data.major_discipline.trim(), data.major_group_id]
  );
  return r.rows[0];
};

export const updateChedMajorDiscipline = async (
  id: number,
  data: { major_code: string; major_discipline: string; major_group_id: number }
) => {
  await ensureChedMajorDisciplinesTable();
  const r = await pool.query(
    `UPDATE ched_major_disciplines SET
      major_code = $1, major_discipline = $2, major_group_id = $3,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 RETURNING *`,
    [
      data.major_code.trim(),
      data.major_discipline.trim(),
      data.major_group_id,
      id,
    ]
  );
  return r.rows[0];
};

export const deleteChedMajorDiscipline = async (id: number) => {
  await ensureChedMajorDisciplinesTable();
  const r = await pool.query(
    "DELETE FROM ched_major_disciplines WHERE id = $1 RETURNING *",
    [id]
  );
  return r.rows[0];
};
