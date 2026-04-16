import pool from "../db.js";

export type SubjectModeRow = {
  id: number;
  mode_code: number;
  mode_name: string;
  short_name: string | null;
  created_at?: Date;
  updated_at?: Date;
};

const SEED: Array<[number, string]> = [
  [1, "Lecture Only"],
  [2, "Laboratory Only"],
  [3, "Seminar Mode"],
  [4, "Independent Reading or Independent Study"],
  [5, "Clinical Internship or Medical Residency"],
  [6, "Apprenticeship or on the Job Training"],
  [7, "Lecture and Field Work"],
  [8, "Fieldwork Only"],
  [12, "Lecture and Laboratory"],
  [80, "Distance Mode"],
  [90, "Thesis or Dissertation Writing"],
  [99, "No Information on the Matter"],
];

export const ensureSubjectModesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subject_modes (
      id SERIAL PRIMARY KEY,
      mode_code INTEGER NOT NULL UNIQUE,
      mode_name VARCHAR(255) NOT NULL,
      short_name VARCHAR(120),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const seedSubjectModesIfEmpty = async () => {
  await ensureSubjectModesTable();
  const c = await pool.query(`SELECT COUNT(*)::int AS n FROM subject_modes`);
  const n = Number(c.rows[0]?.n ?? 0);
  if (n > 0) return;
  for (const [code, name] of SEED) {
    await pool.query(
      `INSERT INTO subject_modes (mode_code, mode_name, short_name) VALUES ($1, $2, NULL)
       ON CONFLICT (mode_code) DO NOTHING`,
      [code, name]
    );
  }
};

export const getAllSubjectModes = async () => {
  await seedSubjectModesIfEmpty();
  const r = await pool.query(
    `SELECT * FROM subject_modes ORDER BY mode_code ASC, id ASC`
  );
  return r.rows as SubjectModeRow[];
};

export const getSubjectModeById = async (id: number) => {
  await ensureSubjectModesTable();
  const r = await pool.query(`SELECT * FROM subject_modes WHERE id = $1`, [id]);
  return r.rows[0] as SubjectModeRow | undefined;
};

export const createSubjectMode = async (data: {
  mode_code: number;
  mode_name: string;
  short_name: string | null;
}) => {
  await ensureSubjectModesTable();
  const r = await pool.query(
    `INSERT INTO subject_modes (mode_code, mode_name, short_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.mode_code, data.mode_name.trim(), data.short_name?.trim() || null]
  );
  return r.rows[0] as SubjectModeRow;
};

export const updateSubjectMode = async (
  id: number,
  data: { mode_code: number; mode_name: string; short_name: string | null }
) => {
  await ensureSubjectModesTable();
  const r = await pool.query(
    `UPDATE subject_modes
     SET mode_code = $1,
         mode_name = $2,
         short_name = $3,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [data.mode_code, data.mode_name.trim(), data.short_name?.trim() || null, id]
  );
  return r.rows[0] as SubjectModeRow | undefined;
};

export const deleteSubjectMode = async (id: number) => {
  await ensureSubjectModesTable();
  const r = await pool.query(`DELETE FROM subject_modes WHERE id = $1 RETURNING *`, [id]);
  return r.rows[0] as SubjectModeRow | undefined;
};
