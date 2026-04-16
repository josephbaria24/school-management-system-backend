import pool from "../db.js";

const ensureInstitutionHeadsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS institution_heads (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const ensureCollegesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS colleges (
      id SERIAL PRIMARY KEY,
      campus_id INTEGER NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
      college_code VARCHAR(50) NOT NULL,
      college_name VARCHAR(255) NOT NULL,
      dean_head_id INTEGER,
      number_code_1 VARCHAR(20),
      number_code_2 VARCHAR(20),
      logo_url TEXT,
      is_inactive BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (campus_id, college_code)
    )
  `);
  // Existing DBs created before logo_url existed: CREATE IF NOT EXISTS does not add columns.
  await pool.query(
    `ALTER TABLE colleges ADD COLUMN IF NOT EXISTS logo_url TEXT`
  );
};

const normalizeLogoUrl = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
};

export const getAllColleges = async (campusId?: number) => {
  await ensureCollegesTable();
  await ensureInstitutionHeadsTable();
  let query = `
    SELECT c.*, h.full_name AS dean_name
    FROM colleges c
    LEFT JOIN institution_heads h ON c.dean_head_id = h.id
  `;
  const params: number[] = [];
  if (campusId && Number.isFinite(campusId)) {
    query += " WHERE c.campus_id = $1";
    params.push(campusId);
  }
  query += " ORDER BY c.college_code ASC";
  const result = await pool.query(query, params);
  return result.rows;
};

export const getCollegeById = async (id: number) => {
  await ensureCollegesTable();
  await ensureInstitutionHeadsTable();
  const result = await pool.query(
    `
    SELECT c.*, h.full_name AS dean_name
    FROM colleges c
    LEFT JOIN institution_heads h ON c.dean_head_id = h.id
    WHERE c.id = $1
    `,
    [id]
  );
  return result.rows[0];
};

export const createCollege = async (data: any) => {
  await ensureCollegesTable();
  const q = `
    INSERT INTO colleges (
      campus_id, college_code, college_name, dean_head_id,
      number_code_1, number_code_2, logo_url, is_inactive
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    data.campus_id,
    data.college_code?.trim(),
    data.college_name?.trim(),
    data.dean_head_id || null,
    data.number_code_1 || null,
    data.number_code_2 || null,
    normalizeLogoUrl(data.logo_url),
    !!data.is_inactive,
  ];
  const result = await pool.query(q, values);
  return result.rows[0];
};

export const updateCollege = async (id: number, data: any) => {
  await ensureCollegesTable();
  const q = `
    UPDATE colleges SET
      campus_id = $1,
      college_code = $2,
      college_name = $3,
      dean_head_id = $4,
      number_code_1 = $5,
      number_code_2 = $6,
      logo_url = $7,
      is_inactive = $8,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING *
  `;
  const values = [
    data.campus_id,
    data.college_code?.trim(),
    data.college_name?.trim(),
    data.dean_head_id || null,
    data.number_code_1 || null,
    data.number_code_2 || null,
    normalizeLogoUrl(data.logo_url),
    !!data.is_inactive,
    id,
  ];
  const result = await pool.query(q, values);
  return result.rows[0];
};

export const deleteCollege = async (id: number) => {
  await ensureCollegesTable();
  const result = await pool.query("DELETE FROM colleges WHERE id = $1 RETURNING *", [
    id,
  ]);
  return result.rows[0];
};
