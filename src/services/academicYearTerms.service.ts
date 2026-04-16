import pool from "../db.js";

const ensureAcademicYearTermsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS academic_year_terms (
      id SERIAL PRIMARY KEY,
      campus VARCHAR(120),
      academic_year VARCHAR(50) NOT NULL,
      term VARCHAR(100) NOT NULL,
      start_date DATE,
      end_date DATE,
      locked BOOLEAN DEFAULT FALSE,
      hidden BOOLEAN DEFAULT FALSE,
      enrollment_start DATE,
      enrollment_end DATE,
      late_enrolment_date DATE,
      add_change_start DATE,
      add_change_end DATE,
      dropping_start DATE,
      dropping_end DATE,
      incomplete_due_date DATE,
      encoding_first_start DATE,
      encoding_first_end DATE,
      encoding_second_start DATE,
      encoding_second_end DATE,
      encoding_third_start DATE,
      encoding_third_end DATE,
      encoding_fourth_start DATE,
      encoding_fourth_end DATE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE academic_year_terms
      ADD COLUMN IF NOT EXISTS campus VARCHAR(120),
      ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS enrollment_start DATE,
      ADD COLUMN IF NOT EXISTS enrollment_end DATE,
      ADD COLUMN IF NOT EXISTS late_enrolment_date DATE,
      ADD COLUMN IF NOT EXISTS add_change_start DATE,
      ADD COLUMN IF NOT EXISTS add_change_end DATE,
      ADD COLUMN IF NOT EXISTS dropping_start DATE,
      ADD COLUMN IF NOT EXISTS dropping_end DATE,
      ADD COLUMN IF NOT EXISTS incomplete_due_date DATE,
      ADD COLUMN IF NOT EXISTS encoding_first_start DATE,
      ADD COLUMN IF NOT EXISTS encoding_first_end DATE,
      ADD COLUMN IF NOT EXISTS encoding_second_start DATE,
      ADD COLUMN IF NOT EXISTS encoding_second_end DATE,
      ADD COLUMN IF NOT EXISTS encoding_third_start DATE,
      ADD COLUMN IF NOT EXISTS encoding_third_end DATE,
      ADD COLUMN IF NOT EXISTS encoding_fourth_start DATE,
      ADD COLUMN IF NOT EXISTS encoding_fourth_end DATE
  `);
};

export const getAllAcademicYearTerms = async () => {
  await ensureAcademicYearTermsTable();
  const result = await pool.query(`
    SELECT *
    FROM academic_year_terms
    ORDER BY academic_year DESC, term ASC, id DESC
  `);
  return result.rows;
};

export const createAcademicYearTerm = async (data: any) => {
  await ensureAcademicYearTermsTable();
  const query = `
    INSERT INTO academic_year_terms (
      campus, academic_year, term, start_date, end_date, locked, hidden,
      enrollment_start, enrollment_end, late_enrolment_date,
      add_change_start, add_change_end,
      dropping_start, dropping_end,
      incomplete_due_date,
      encoding_first_start, encoding_first_end,
      encoding_second_start, encoding_second_end,
      encoding_third_start, encoding_third_end,
      encoding_fourth_start, encoding_fourth_end
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10,
      $11, $12,
      $13, $14,
      $15,
      $16, $17,
      $18, $19,
      $20, $21,
      $22, $23
    )
    RETURNING *
  `;
  const values = [
    data.campus || null,
    data.academic_year,
    data.term,
    data.start_date || null,
    data.end_date || null,
    !!data.locked,
    !!data.hidden,
    data.enrollment_start || null,
    data.enrollment_end || null,
    data.late_enrolment_date || null,
    data.add_change_start || null,
    data.add_change_end || null,
    data.dropping_start || null,
    data.dropping_end || null,
    data.incomplete_due_date || null,
    data.encoding_first_start || null,
    data.encoding_first_end || null,
    data.encoding_second_start || null,
    data.encoding_second_end || null,
    data.encoding_third_start || null,
    data.encoding_third_end || null,
    data.encoding_fourth_start || null,
    data.encoding_fourth_end || null,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateAcademicYearTerm = async (id: number, data: any) => {
  await ensureAcademicYearTermsTable();
  const query = `
    UPDATE academic_year_terms
    SET campus = $1,
        academic_year = $2,
        term = $3,
        start_date = $4,
        end_date = $5,
        locked = $6,
        hidden = $7,
        enrollment_start = $8,
        enrollment_end = $9,
        late_enrolment_date = $10,
        add_change_start = $11,
        add_change_end = $12,
        dropping_start = $13,
        dropping_end = $14,
        incomplete_due_date = $15,
        encoding_first_start = $16,
        encoding_first_end = $17,
        encoding_second_start = $18,
        encoding_second_end = $19,
        encoding_third_start = $20,
        encoding_third_end = $21,
        encoding_fourth_start = $22,
        encoding_fourth_end = $23,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $24
    RETURNING *
  `;
  const values = [
    data.campus || null,
    data.academic_year,
    data.term,
    data.start_date || null,
    data.end_date || null,
    !!data.locked,
    !!data.hidden,
    data.enrollment_start || null,
    data.enrollment_end || null,
    data.late_enrolment_date || null,
    data.add_change_start || null,
    data.add_change_end || null,
    data.dropping_start || null,
    data.dropping_end || null,
    data.incomplete_due_date || null,
    data.encoding_first_start || null,
    data.encoding_first_end || null,
    data.encoding_second_start || null,
    data.encoding_second_end || null,
    data.encoding_third_start || null,
    data.encoding_third_end || null,
    data.encoding_fourth_start || null,
    data.encoding_fourth_end || null,
    id,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteAcademicYearTerm = async (id: number) => {
  await ensureAcademicYearTermsTable();
  const result = await pool.query("DELETE FROM academic_year_terms WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};
