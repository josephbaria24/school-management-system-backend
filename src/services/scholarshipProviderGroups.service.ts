import pool from "../db.js";

/** Table name avoids `scholarship_provider_groups`, which can collide with a stale
 *  PostgreSQL composite type in `pg_type` after a failed DDL (23505 on pg_type_typname_nsp_index). */
export const ensureScholarshipProviderGroupsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scholarship_groups (
      id SERIAL PRIMARY KEY,
      group_code VARCHAR(50) NOT NULL,
      group_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (group_code)
    )
  `);
};

export const getAllScholarshipProviderGroups = async () => {
  await ensureScholarshipProviderGroupsTable();
  const r = await pool.query(
    "SELECT * FROM scholarship_groups ORDER BY group_code ASC"
  );
  return r.rows;
};

export const createScholarshipProviderGroup = async (data: {
  group_code: string;
  group_name: string;
}) => {
  await ensureScholarshipProviderGroupsTable();
  const r = await pool.query(
    `INSERT INTO scholarship_groups (group_code, group_name)
     VALUES ($1, $2) RETURNING *`,
    [data.group_code.trim(), data.group_name.trim()]
  );
  return r.rows[0];
};
