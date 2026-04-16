import pool from "../db.js";

export const EMPLOYEE_OPTION_CATEGORIES = [
  "teaching_load_educ_level",
  "degree_discipline",
  "prc_licensure",
] as const;

export type EmployeeOptionCategory = (typeof EMPLOYEE_OPTION_CATEGORIES)[number];

export const isEmployeeOptionCategory = (
  value: unknown
): value is EmployeeOptionCategory =>
  EMPLOYEE_OPTION_CATEGORIES.includes(value as EmployeeOptionCategory);

export const ensureEmployeeOptionItemsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_option_items (
      id SERIAL PRIMARY KEY,
      category VARCHAR(80) NOT NULL,
      value VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (category, value)
    )
  `);
};

export const getEmployeeOptionItems = async (category: EmployeeOptionCategory) => {
  await ensureEmployeeOptionItemsTable();
  const r = await pool.query(
    `SELECT id, category, value
     FROM employee_option_items
     WHERE category = $1
     ORDER BY value ASC`,
    [category]
  );
  return r.rows;
};

export const createEmployeeOptionItem = async (
  category: EmployeeOptionCategory,
  value: string
) => {
  await ensureEmployeeOptionItemsTable();
  const r = await pool.query(
    `INSERT INTO employee_option_items (category, value)
     VALUES ($1, $2)
     RETURNING id, category, value`,
    [category, value.trim()]
  );
  return r.rows[0];
};

export const updateEmployeeOptionItem = async (id: number, value: string) => {
  await ensureEmployeeOptionItemsTable();
  const r = await pool.query(
    `UPDATE employee_option_items
     SET value = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, category, value`,
    [value.trim(), id]
  );
  return r.rows[0];
};

export const deleteEmployeeOptionItem = async (id: number) => {
  await ensureEmployeeOptionItemsTable();
  const r = await pool.query(
    `DELETE FROM employee_option_items
     WHERE id = $1
     RETURNING id, category, value`,
    [id]
  );
  return r.rows[0];
};
