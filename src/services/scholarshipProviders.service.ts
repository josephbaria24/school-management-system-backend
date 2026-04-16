import pool from "../db.js";
import { ensureScholarshipProviderGroupsTable } from "./scholarshipProviderGroups.service.js";

export const ensureScholarshipProvidersTable = async () => {
  await ensureScholarshipProviderGroupsTable();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scholarship_providers (
      id SERIAL PRIMARY KEY,
      provider_code VARCHAR(50) NOT NULL UNIQUE,
      provider_name VARCHAR(500) NOT NULL,
      short_name VARCHAR(100),
      acronym VARCHAR(50),
      remarks TEXT,
      group_id INTEGER REFERENCES scholarship_groups(id) ON DELETE SET NULL,
      is_inactive BOOLEAN DEFAULT FALSE,
      auto_credit_financial_aid BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getAllScholarshipProviders = async () => {
  await ensureScholarshipProvidersTable();
  const r = await pool.query(`
    SELECT p.*, g.group_code, g.group_name
    FROM scholarship_providers p
    LEFT JOIN scholarship_groups g ON p.group_id = g.id
    ORDER BY p.provider_code ASC
  `);
  return r.rows;
};

export const createScholarshipProvider = async (data: {
  provider_code: string;
  provider_name: string;
  short_name: string | null;
  acronym: string | null;
  remarks: string | null;
  group_id: number | null;
  is_inactive: boolean;
  auto_credit_financial_aid: boolean;
}) => {
  await ensureScholarshipProvidersTable();
  const r = await pool.query(
    `INSERT INTO scholarship_providers (
      provider_code, provider_name, short_name, acronym, remarks,
      group_id, is_inactive, auto_credit_financial_aid
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      data.provider_code.trim(),
      data.provider_name.trim(),
      data.short_name?.trim() || null,
      data.acronym?.trim() || null,
      data.remarks?.trim() || null,
      data.group_id,
      data.is_inactive,
      data.auto_credit_financial_aid,
    ]
  );
  return r.rows[0];
};

export const updateScholarshipProvider = async (
  id: number,
  data: {
    provider_code: string;
    provider_name: string;
    short_name: string | null;
    acronym: string | null;
    remarks: string | null;
    group_id: number | null;
    is_inactive: boolean;
    auto_credit_financial_aid: boolean;
  }
) => {
  await ensureScholarshipProvidersTable();
  const r = await pool.query(
    `UPDATE scholarship_providers SET
      provider_code = $1, provider_name = $2, short_name = $3, acronym = $4,
      remarks = $5, group_id = $6, is_inactive = $7, auto_credit_financial_aid = $8,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $9 RETURNING *`,
    [
      data.provider_code.trim(),
      data.provider_name.trim(),
      data.short_name?.trim() || null,
      data.acronym?.trim() || null,
      data.remarks?.trim() || null,
      data.group_id,
      data.is_inactive,
      data.auto_credit_financial_aid,
      id,
    ]
  );
  return r.rows[0];
};

export const deleteScholarshipProvider = async (id: number) => {
  await ensureScholarshipProvidersTable();
  const r = await pool.query(
    "DELETE FROM scholarship_providers WHERE id = $1 RETURNING *",
    [id]
  );
  return r.rows[0];
};
