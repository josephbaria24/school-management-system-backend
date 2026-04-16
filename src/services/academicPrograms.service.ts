import pool from "../db.js";

export const ensureAcademicProgramsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS academic_programs (
      id SERIAL PRIMARY KEY,
      campus_id INTEGER NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
      college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
      program_code VARCHAR(50) NOT NULL,
      program_name VARCHAR(255) NOT NULL,
      short_name VARCHAR(100),
      admission_number_code VARCHAR(50),
      status VARCHAR(20) DEFAULT 'active',
      term VARCHAR(50),
      program_alias BOOLEAN DEFAULT FALSE,
      no_of_years INT,
      max_residency INT,
      total_academic_subjects INT,
      total_academic_credit_units NUMERIC(12,2),
      academic_program_weight NUMERIC(12,2),
      total_ge_units NUMERIC(12,2),
      total_major_units NUMERIC(12,2),
      total_elective_units NUMERIC(12,2),
      total_lecture_units NUMERIC(12,2),
      total_non_lecture_units NUMERIC(12,2),
      classification VARCHAR(100),
      thesis_option VARCHAR(100),
      board_exam VARCHAR(100),
      ladder VARCHAR(100),
      parent_program VARCHAR(255),
      date_recognized DATE,
      date_revised DATE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (college_id, program_code)
    )
  `);
};

export const getAllAcademicPrograms = async (collegeId?: number) => {
  await ensureAcademicProgramsTable();
  let q = `
    SELECT p.*, c.college_code, c.college_name
    FROM academic_programs p
    JOIN colleges c ON p.college_id = c.id
  `;
  const params: number[] = [];
  if (collegeId && Number.isFinite(collegeId)) {
    q += " WHERE p.college_id = $1";
    params.push(collegeId);
  }
  q += " ORDER BY p.program_code ASC";
  const r = await pool.query(q, params);
  return r.rows;
};

export const getAcademicProgramById = async (id: number) => {
  await ensureAcademicProgramsTable();
  const r = await pool.query(
    `
    SELECT p.*, c.college_code, c.college_name
    FROM academic_programs p
    JOIN colleges c ON p.college_id = c.id
    WHERE p.id = $1
    `,
    [id]
  );
  return r.rows[0];
};

export const createAcademicProgram = async (data: Record<string, unknown>) => {
  await ensureAcademicProgramsTable();
  const q = `
    INSERT INTO academic_programs (
      campus_id, college_id, program_code, program_name, short_name, admission_number_code,
      status, term, program_alias, no_of_years, max_residency, total_academic_subjects,
      total_academic_credit_units, academic_program_weight, total_ge_units, total_major_units,
      total_elective_units, total_lecture_units, total_non_lecture_units,
      classification, thesis_option, board_exam, ladder, parent_program,
      date_recognized, date_revised
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
    ) RETURNING *
  `;
  const v = [
    data.campus_id,
    data.college_id,
    data.program_code,
    data.program_name,
    data.short_name ?? null,
    data.admission_number_code ?? null,
    data.status ?? "active",
    data.term ?? null,
    !!data.program_alias,
    data.no_of_years ?? null,
    data.max_residency ?? null,
    data.total_academic_subjects ?? null,
    data.total_academic_credit_units ?? null,
    data.academic_program_weight ?? null,
    data.total_ge_units ?? null,
    data.total_major_units ?? null,
    data.total_elective_units ?? null,
    data.total_lecture_units ?? null,
    data.total_non_lecture_units ?? null,
    data.classification ?? null,
    data.thesis_option ?? null,
    data.board_exam ?? null,
    data.ladder ?? null,
    data.parent_program ?? null,
    data.date_recognized || null,
    data.date_revised || null,
  ];
  const r = await pool.query(q, v);
  return r.rows[0];
};

export const updateAcademicProgram = async (
  id: number,
  data: Record<string, unknown>
) => {
  await ensureAcademicProgramsTable();
  const q = `
    UPDATE academic_programs SET
      campus_id = $1, college_id = $2, program_code = $3, program_name = $4,
      short_name = $5, admission_number_code = $6, status = $7, term = $8,
      program_alias = $9, no_of_years = $10, max_residency = $11,
      total_academic_subjects = $12, total_academic_credit_units = $13,
      academic_program_weight = $14, total_ge_units = $15, total_major_units = $16,
      total_elective_units = $17, total_lecture_units = $18, total_non_lecture_units = $19,
      classification = $20, thesis_option = $21, board_exam = $22, ladder = $23,
      parent_program = $24, date_recognized = $25, date_revised = $26,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $27 RETURNING *
  `;
  const v = [
    data.campus_id,
    data.college_id,
    data.program_code,
    data.program_name,
    data.short_name ?? null,
    data.admission_number_code ?? null,
    data.status ?? "active",
    data.term ?? null,
    !!data.program_alias,
    data.no_of_years ?? null,
    data.max_residency ?? null,
    data.total_academic_subjects ?? null,
    data.total_academic_credit_units ?? null,
    data.academic_program_weight ?? null,
    data.total_ge_units ?? null,
    data.total_major_units ?? null,
    data.total_elective_units ?? null,
    data.total_lecture_units ?? null,
    data.total_non_lecture_units ?? null,
    data.classification ?? null,
    data.thesis_option ?? null,
    data.board_exam ?? null,
    data.ladder ?? null,
    data.parent_program ?? null,
    data.date_recognized || null,
    data.date_revised || null,
    id,
  ];
  const r = await pool.query(q, v);
  return r.rows[0];
};

export const deleteAcademicProgram = async (id: number) => {
  await ensureAcademicProgramsTable();
  const r = await pool.query(
    "DELETE FROM academic_programs WHERE id = $1 RETURNING *",
    [id]
  );
  return r.rows[0];
};
