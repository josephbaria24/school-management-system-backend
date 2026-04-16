import pool from "../db.js";

export const ensureDepartmentsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      campus_id INTEGER NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
      college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL,
      dept_code VARCHAR(50) NOT NULL,
      dept_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (campus_id, dept_code)
    )
  `);
};

export const getAllDepartments = async () => {
  await ensureDepartmentsTable();
  const r = await pool.query(`
    SELECT d.*,
      ca.acronym AS campus_acronym,
      ca.campus_name AS campus_name,
      c.college_code,
      c.college_name
    FROM departments d
    JOIN campuses ca ON d.campus_id = ca.id
    LEFT JOIN colleges c ON d.college_id = c.id
    ORDER BY d.dept_name ASC, d.dept_code ASC
  `);
  return r.rows;
};

export const getDepartmentById = async (id: number) => {
  await ensureDepartmentsTable();
  const r = await pool.query(
    `
    SELECT d.*,
      ca.acronym AS campus_acronym,
      c.college_code,
      c.college_name
    FROM departments d
    JOIN campuses ca ON d.campus_id = ca.id
    LEFT JOIN colleges c ON d.college_id = c.id
    WHERE d.id = $1
    `,
    [id]
  );
  return r.rows[0];
};

export const createDepartment = async (data: {
  campus_id: number;
  college_id: number | null;
  dept_code: string;
  dept_name: string;
}) => {
  await ensureDepartmentsTable();
  const r = await pool.query(
    `INSERT INTO departments (campus_id, college_id, dept_code, dept_name)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      data.campus_id,
      data.college_id,
      data.dept_code.trim(),
      data.dept_name.trim(),
    ]
  );
  return r.rows[0];
};

export const updateDepartment = async (
  id: number,
  data: {
    campus_id: number;
    college_id: number | null;
    dept_code: string;
    dept_name: string;
  }
) => {
  await ensureDepartmentsTable();
  const r = await pool.query(
    `UPDATE departments SET
      campus_id = $1, college_id = $2, dept_code = $3, dept_name = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5 RETURNING *`,
    [
      data.campus_id,
      data.college_id,
      data.dept_code.trim(),
      data.dept_name.trim(),
      id,
    ]
  );
  return r.rows[0];
};

export const deleteDepartment = async (id: number) => {
  await ensureDepartmentsTable();
  const r = await pool.query(
    "DELETE FROM departments WHERE id = $1 RETURNING *",
    [id]
  );
  return r.rows[0];
};
