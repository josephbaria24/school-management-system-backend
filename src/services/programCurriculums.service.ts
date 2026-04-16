import pool from "../db.js";
import { ensureAcademicProgramsTable } from "./academicPrograms.service.js";
import { ensureChedMajorDisciplinesTable } from "./chedMajorDisciplines.service.js";

export const ensureProgramCurriculumsTables = async () => {
  await ensureAcademicProgramsTable();
  await ensureChedMajorDisciplinesTable();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS program_curriculums (
      id SERIAL PRIMARY KEY,
      campus_id INTEGER NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
      academic_program_id INTEGER NOT NULL REFERENCES academic_programs(id) ON DELETE RESTRICT,
      major_discipline_id INTEGER REFERENCES ched_major_disciplines(id) ON DELETE SET NULL,
      term_label VARCHAR(60),
      no_of_years INTEGER,
      total_terms INTEGER,
      curriculum_code VARCHAR(100) NOT NULL,
      description TEXT,
      notes TEXT,
      is_locked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (academic_program_id, curriculum_code)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS program_curriculum_subjects (
      id SERIAL PRIMARY KEY,
      curriculum_id INTEGER NOT NULL REFERENCES program_curriculums(id) ON DELETE CASCADE,
      subject_code VARCHAR(100) NOT NULL,
      descriptive_title TEXT NOT NULL,
      lab_unit NUMERIC(8,2) DEFAULT 0,
      lec_unit NUMERIC(8,2) DEFAULT 0,
      credit_unit NUMERIC(8,2) DEFAULT 0,
      lecture_hour NUMERIC(8,2) DEFAULT 0,
      laboratory_hour NUMERIC(8,2) DEFAULT 0,
      sort_order INTEGER,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getProgramCurriculums = async (opts?: {
  campus_id?: number;
  academic_program_id?: number;
}) => {
  await ensureProgramCurriculumsTables();
  const params: number[] = [];
  const where: string[] = [];
  if (opts?.campus_id && Number.isFinite(opts.campus_id)) {
    params.push(opts.campus_id);
    where.push(`pc.campus_id = $${params.length}`);
  }
  if (opts?.academic_program_id && Number.isFinite(opts.academic_program_id)) {
    params.push(opts.academic_program_id);
    where.push(`pc.academic_program_id = $${params.length}`);
  }

  const sql = `
    SELECT
      pc.*,
      ap.program_code,
      ap.program_name,
      cmd.major_code,
      cmd.major_discipline,
      ca.acronym AS campus_acronym
    FROM program_curriculums pc
    JOIN academic_programs ap ON ap.id = pc.academic_program_id
    LEFT JOIN ched_major_disciplines cmd ON cmd.id = pc.major_discipline_id
    LEFT JOIN campuses ca ON ca.id = pc.campus_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY pc.curriculum_code ASC
  `;
  const r = await pool.query(sql, params);
  return r.rows;
};

export const getProgramCurriculumById = async (id: number) => {
  await ensureProgramCurriculumsTables();
  const r = await pool.query(
    `
    SELECT
      pc.*,
      ap.program_code,
      ap.program_name,
      cmd.major_code,
      cmd.major_discipline
    FROM program_curriculums pc
    JOIN academic_programs ap ON ap.id = pc.academic_program_id
    LEFT JOIN ched_major_disciplines cmd ON cmd.id = pc.major_discipline_id
    WHERE pc.id = $1
    `,
    [id]
  );
  return r.rows[0];
};

export const createProgramCurriculum = async (data: {
  campus_id: number;
  academic_program_id: number;
  major_discipline_id: number | null;
  term_label: string | null;
  no_of_years: number | null;
  total_terms: number | null;
  curriculum_code: string;
  description: string | null;
  notes: string | null;
  is_locked: boolean;
}) => {
  await ensureProgramCurriculumsTables();
  const r = await pool.query(
    `
    INSERT INTO program_curriculums (
      campus_id, academic_program_id, major_discipline_id, term_label, no_of_years, total_terms,
      curriculum_code, description, notes, is_locked
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
    )
    RETURNING *
    `,
    [
      data.campus_id,
      data.academic_program_id,
      data.major_discipline_id,
      data.term_label,
      data.no_of_years,
      data.total_terms,
      data.curriculum_code.trim(),
      data.description,
      data.notes,
      data.is_locked,
    ]
  );
  return r.rows[0];
};

export const updateProgramCurriculum = async (
  id: number,
  data: {
    campus_id: number;
    academic_program_id: number;
    major_discipline_id: number | null;
    term_label: string | null;
    no_of_years: number | null;
    total_terms: number | null;
    curriculum_code: string;
    description: string | null;
    notes: string | null;
    is_locked: boolean;
  }
) => {
  await ensureProgramCurriculumsTables();
  const r = await pool.query(
    `
    UPDATE program_curriculums
    SET
      campus_id = $1,
      academic_program_id = $2,
      major_discipline_id = $3,
      term_label = $4,
      no_of_years = $5,
      total_terms = $6,
      curriculum_code = $7,
      description = $8,
      notes = $9,
      is_locked = $10,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11
    RETURNING *
    `,
    [
      data.campus_id,
      data.academic_program_id,
      data.major_discipline_id,
      data.term_label,
      data.no_of_years,
      data.total_terms,
      data.curriculum_code.trim(),
      data.description,
      data.notes,
      data.is_locked,
      id,
    ]
  );
  return r.rows[0];
};

export const deleteProgramCurriculum = async (id: number) => {
  await ensureProgramCurriculumsTables();
  const r = await pool.query(`DELETE FROM program_curriculums WHERE id = $1 RETURNING *`, [id]);
  return r.rows[0];
};

export const getCurriculumSubjects = async (curriculumId: number) => {
  await ensureProgramCurriculumsTables();
  const r = await pool.query(
    `
    SELECT *
    FROM program_curriculum_subjects
    WHERE curriculum_id = $1
    ORDER BY sort_order ASC NULLS LAST, id ASC
    `,
    [curriculumId]
  );
  return r.rows;
};

export const createCurriculumSubject = async (
  curriculumId: number,
  data: {
    subject_code: string;
    descriptive_title: string;
    lab_unit: number | null;
    lec_unit: number | null;
    credit_unit: number | null;
    lecture_hour: number | null;
    laboratory_hour: number | null;
  }
) => {
  await ensureProgramCurriculumsTables();
  const maxOrder = await pool.query(
    `SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM program_curriculum_subjects WHERE curriculum_id = $1`,
    [curriculumId]
  );
  const nextOrder = Number(maxOrder.rows[0]?.max_order || 0) + 1;
  const r = await pool.query(
    `
    INSERT INTO program_curriculum_subjects (
      curriculum_id, subject_code, descriptive_title, lab_unit, lec_unit, credit_unit, lecture_hour, laboratory_hour, sort_order
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9
    )
    RETURNING *
    `,
    [
      curriculumId,
      data.subject_code.trim(),
      data.descriptive_title.trim(),
      data.lab_unit ?? 0,
      data.lec_unit ?? 0,
      data.credit_unit ?? 0,
      data.lecture_hour ?? 0,
      data.laboratory_hour ?? 0,
      nextOrder,
    ]
  );
  return r.rows[0];
};

export const updateCurriculumSubject = async (
  id: number,
  data: {
    subject_code: string;
    descriptive_title: string;
    lab_unit: number | null;
    lec_unit: number | null;
    credit_unit: number | null;
    lecture_hour: number | null;
    laboratory_hour: number | null;
  }
) => {
  await ensureProgramCurriculumsTables();
  const r = await pool.query(
    `
    UPDATE program_curriculum_subjects
    SET
      subject_code = $1,
      descriptive_title = $2,
      lab_unit = $3,
      lec_unit = $4,
      credit_unit = $5,
      lecture_hour = $6,
      laboratory_hour = $7,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $8
    RETURNING *
    `,
    [
      data.subject_code.trim(),
      data.descriptive_title.trim(),
      data.lab_unit ?? 0,
      data.lec_unit ?? 0,
      data.credit_unit ?? 0,
      data.lecture_hour ?? 0,
      data.laboratory_hour ?? 0,
      id,
    ]
  );
  return r.rows[0];
};

export const deleteCurriculumSubject = async (id: number) => {
  await ensureProgramCurriculumsTables();
  const r = await pool.query(
    `DELETE FROM program_curriculum_subjects WHERE id = $1 RETURNING *`,
    [id]
  );
  return r.rows[0];
};

