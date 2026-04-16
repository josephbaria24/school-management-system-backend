import pool from "../db.js";

export type SubjectAreaRow = {
  id: number;
  area_code: number;
  area_name: string;
  short_name: string | null;
  created_at?: Date;
  updated_at?: Date;
};

const SEED: Array<[number, string]> = [
  [1, "General Information"],
  [2, "General Science"],
  [3, "Mathematics and Arithmetics"],
  [4, "Technological"],
  [5, "Business Information System"],
  [6, "Business and Mangement"],
  [7, "Accounting"],
  [8, "Economics"],
  [9, "Fine Arts"],
  [10, "Nursing Related"],
  [11, "Architecture"],
];

export const ensureSubjectAreasTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subject_areas (
      id SERIAL PRIMARY KEY,
      area_code INTEGER NOT NULL UNIQUE,
      area_name VARCHAR(255) NOT NULL,
      short_name VARCHAR(120),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const seedSubjectAreasIfEmpty = async () => {
  await ensureSubjectAreasTable();
  const c = await pool.query(`SELECT COUNT(*)::int AS n FROM subject_areas`);
  const n = Number(c.rows[0]?.n ?? 0);
  if (n > 0) return;
  for (const [code, name] of SEED) {
    await pool.query(
      `INSERT INTO subject_areas (area_code, area_name, short_name) VALUES ($1, $2, NULL)
       ON CONFLICT (area_code) DO NOTHING`,
      [code, name]
    );
  }
};

export const getAllSubjectAreas = async () => {
  await seedSubjectAreasIfEmpty();
  const r = await pool.query(
    `SELECT * FROM subject_areas ORDER BY area_code ASC, id ASC`
  );
  return r.rows as SubjectAreaRow[];
};

export const getSubjectAreaById = async (id: number) => {
  await ensureSubjectAreasTable();
  const r = await pool.query(`SELECT * FROM subject_areas WHERE id = $1`, [id]);
  return r.rows[0] as SubjectAreaRow | undefined;
};

export const createSubjectArea = async (data: {
  area_code: number;
  area_name: string;
  short_name: string | null;
}) => {
  await ensureSubjectAreasTable();
  const r = await pool.query(
    `INSERT INTO subject_areas (area_code, area_name, short_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.area_code, data.area_name.trim(), data.short_name?.trim() || null]
  );
  return r.rows[0] as SubjectAreaRow;
};

export const updateSubjectArea = async (
  id: number,
  data: { area_code: number; area_name: string; short_name: string | null }
) => {
  await ensureSubjectAreasTable();
  const r = await pool.query(
    `UPDATE subject_areas
     SET area_code = $1,
         area_name = $2,
         short_name = $3,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [data.area_code, data.area_name.trim(), data.short_name?.trim() || null, id]
  );
  return r.rows[0] as SubjectAreaRow | undefined;
};

export const deleteSubjectArea = async (id: number) => {
  await ensureSubjectAreasTable();
  const r = await pool.query(`DELETE FROM subject_areas WHERE id = $1 RETURNING *`, [id]);
  return r.rows[0] as SubjectAreaRow | undefined;
};
