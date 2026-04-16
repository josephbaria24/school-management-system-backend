import pool from "../db.js";
import { ensureDepartmentsTable } from "./departments.service.js";
import { ensurePositionsTable } from "./positions.service.js";

export const ensureEmployeesTable = async () => {
  await ensurePositionsTable();
  await ensureDepartmentsTable();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      employee_id VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(30),
      last_name VARCHAR(100) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100),
      middle_initial VARCHAR(10),
      suffix VARCHAR(30),
      birthday DATE,
      gender VARCHAR(30),
      civil_status VARCHAR(50),
      position_label VARCHAR(255),
      department_label VARCHAR(255),
      is_faculty BOOLEAN DEFAULT FALSE,
      is_inactive BOOLEAN DEFAULT FALSE,
      photo_url TEXT,
      signature_url TEXT,
      faculty_rank VARCHAR(120),
      is_full_time BOOLEAN,
      campus_id INTEGER REFERENCES campuses(id) ON DELETE SET NULL,
      college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL,
      teaching_load_educ_level VARCHAR(120),
      degree_discipline VARCHAR(255),
      prc_licensure VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id INTEGER
    REFERENCES departments(id) ON DELETE SET NULL
  `);
  await pool.query(`
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_id INTEGER
    REFERENCES positions(id) ON DELETE SET NULL
  `);
};

export type EmployeeRow = Record<string, unknown>;

export const getAllEmployees = async (opts?: { hideInactive?: boolean }) => {
  await ensureEmployeesTable();
  let q = `
    SELECT e.*,
      ca.acronym AS campus_acronym,
      ca.campus_name AS campus_name,
      c.college_code,
      c.college_name,
      dep.dept_code AS department_code,
      dep.dept_name AS department_name,
      pos.position_code AS position_code_ref,
      pos.position_title AS position_title_ref,
      pos.short_name AS position_short_name_ref
    FROM employees e
    LEFT JOIN campuses ca ON e.campus_id = ca.id
    LEFT JOIN colleges c ON e.college_id = c.id
    LEFT JOIN departments dep ON e.department_id = dep.id
    LEFT JOIN positions pos ON e.position_id = pos.id
  `;
  if (opts?.hideInactive) {
    q += " WHERE COALESCE(e.is_inactive, FALSE) = FALSE";
  }
  q += " ORDER BY e.last_name ASC, e.first_name ASC, e.employee_id ASC";
  const r = await pool.query(q);
  return r.rows;
};

export const getEmployeeById = async (id: number) => {
  await ensureEmployeesTable();
  const r = await pool.query(
    `
    SELECT e.*,
      ca.acronym AS campus_acronym,
      ca.campus_name AS campus_name,
      c.college_code,
      c.college_name,
      dep.dept_code AS department_code,
      dep.dept_name AS department_name,
      pos.position_code AS position_code_ref,
      pos.position_title AS position_title_ref,
      pos.short_name AS position_short_name_ref
    FROM employees e
    LEFT JOIN campuses ca ON e.campus_id = ca.id
    LEFT JOIN colleges c ON e.college_id = c.id
    LEFT JOIN departments dep ON e.department_id = dep.id
    LEFT JOIN positions pos ON e.position_id = pos.id
    WHERE e.id = $1
    `,
    [id]
  );
  return r.rows[0];
};

function normalizeRow(data: Record<string, unknown>) {
  const s = (v: unknown) =>
    v === undefined || v === null || String(v).trim() === ""
      ? null
      : String(v).trim();
  const n = (v: unknown) => {
    if (v === "" || v === undefined || v === null) return null;
    const x = typeof v === "number" ? v : parseInt(String(v), 10);
    return Number.isFinite(x) ? x : null;
  };
  const d = (v: unknown) => {
    const t = s(v);
    return t;
  };
  const b = (v: unknown) => !!v;

  return {
    employee_id: s(data.employee_id),
    title: s(data.title),
    last_name: s(data.last_name),
    first_name: s(data.first_name),
    middle_name: s(data.middle_name),
    middle_initial: s(data.middle_initial),
    suffix: s(data.suffix),
    birthday: d(data.birthday),
    gender: s(data.gender),
    civil_status: s(data.civil_status),
    position_label: s(data.position_label),
    position_id: n(data.position_id),
    department_label: s(data.department_label),
    department_id: n(data.department_id),
    is_faculty: b(data.is_faculty),
    is_inactive: b(data.is_inactive),
    photo_url: s(data.photo_url),
    signature_url: s(data.signature_url),
    faculty_rank: s(data.faculty_rank),
    is_full_time:
      data.is_full_time === true || data.is_full_time === "true"
        ? true
        : data.is_full_time === false || data.is_full_time === "false"
          ? false
          : null,
    campus_id: n(data.campus_id),
    college_id: n(data.college_id),
    teaching_load_educ_level: s(data.teaching_load_educ_level),
    degree_discipline: s(data.degree_discipline),
    prc_licensure: s(data.prc_licensure),
  };
}

export const createEmployee = async (data: Record<string, unknown>) => {
  await ensureEmployeesTable();
  const r = normalizeRow(data);
  const q = `
    INSERT INTO employees (
      employee_id, title, last_name, first_name, middle_name, middle_initial, suffix,
      birthday, gender, civil_status, position_label, position_id, department_label, department_id,
      is_faculty, is_inactive, photo_url, signature_url,
      faculty_rank, is_full_time, campus_id, college_id,
      teaching_load_educ_level, degree_discipline, prc_licensure
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
    ) RETURNING *
  `;
  const v = [
    r.employee_id,
    r.title,
    r.last_name,
    r.first_name,
    r.middle_name,
    r.middle_initial,
    r.suffix,
    r.birthday,
    r.gender,
    r.civil_status,
    r.position_label,
    r.position_id,
    r.department_label,
    r.department_id,
    r.is_faculty,
    r.is_inactive,
    r.photo_url,
    r.signature_url,
    r.faculty_rank,
    r.is_full_time,
    r.campus_id,
    r.college_id,
    r.teaching_load_educ_level,
    r.degree_discipline,
    r.prc_licensure,
  ];
  const result = await pool.query(q, v);
  return result.rows[0];
};

export const updateEmployee = async (
  id: number,
  data: Record<string, unknown>
) => {
  await ensureEmployeesTable();
  const r = normalizeRow(data);
  const q = `
    UPDATE employees SET
      employee_id = $1, title = $2, last_name = $3, first_name = $4,
      middle_name = $5, middle_initial = $6, suffix = $7,
      birthday = $8, gender = $9, civil_status = $10,
      position_label = $11, position_id = $12, department_label = $13, department_id = $14,
      is_faculty = $15, is_inactive = $16, photo_url = $17, signature_url = $18,
      faculty_rank = $19, is_full_time = $20, campus_id = $21, college_id = $22,
      teaching_load_educ_level = $23, degree_discipline = $24, prc_licensure = $25,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $26 RETURNING *
  `;
  const v = [
    r.employee_id,
    r.title,
    r.last_name,
    r.first_name,
    r.middle_name,
    r.middle_initial,
    r.suffix,
    r.birthday,
    r.gender,
    r.civil_status,
    r.position_label,
    r.position_id,
    r.department_label,
    r.department_id,
    r.is_faculty,
    r.is_inactive,
    r.photo_url,
    r.signature_url,
    r.faculty_rank,
    r.is_full_time,
    r.campus_id,
    r.college_id,
    r.teaching_load_educ_level,
    r.degree_discipline,
    r.prc_licensure,
    id,
  ];
  const result = await pool.query(q, v);
  return result.rows[0];
};

export const deleteEmployee = async (id: number) => {
  await ensureEmployeesTable();
  const r = await pool.query(
    "DELETE FROM employees WHERE id = $1 RETURNING *",
    [id]
  );
  return r.rows[0];
};
