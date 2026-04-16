import pool from "../db.js";

export const ensureCoursesMasterListTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses_master_list (
      id SERIAL PRIMARY KEY,
      course_code VARCHAR(80) NOT NULL UNIQUE,
      course_title VARCHAR(255) NOT NULL,
      course_description TEXT,
      laboratory_units NUMERIC(10,2) DEFAULT 0,
      academic_units_lecture NUMERIC(10,2) DEFAULT 0,
      credited_units NUMERIC(10,2) DEFAULT 0,
      lecture_hours NUMERIC(10,2) DEFAULT 0,
      laboratory_hours NUMERIC(10,2) DEFAULT 0,
      general_education BOOLEAN DEFAULT FALSE,
      major_course BOOLEAN DEFAULT FALSE,
      elective_course BOOLEAN DEFAULT FALSE,
      computer_course BOOLEAN DEFAULT FALSE,
      e_learning BOOLEAN DEFAULT FALSE,
      course_with_internet BOOLEAN DEFAULT FALSE,
      include_in_gwa BOOLEAN DEFAULT FALSE,
      non_academic_course BOOLEAN DEFAULT FALSE,
      club_organization_course BOOLEAN DEFAULT FALSE,
      from_other_school BOOLEAN DEFAULT FALSE,
      use_transmuted_grade BOOLEAN DEFAULT FALSE,
      is_inactive BOOLEAN DEFAULT FALSE,
      code_alias_1 VARCHAR(80),
      code_alias_2 VARCHAR(80),
      parent_code VARCHAR(80),
      course_level VARCHAR(120),
      course_area VARCHAR(120),
      course_mode VARCHAR(120),
      default_min_class_limit INTEGER,
      default_max_class_limit INTEGER,
      is_locked_subject BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getAllCourses = async () => {
  await ensureCoursesMasterListTable();
  const r = await pool.query(`
    SELECT *
    FROM courses_master_list
    ORDER BY course_code ASC
  `);
  return r.rows;
};

export const getCourseById = async (id: number) => {
  await ensureCoursesMasterListTable();
  const r = await pool.query(`SELECT * FROM courses_master_list WHERE id = $1`, [id]);
  return r.rows[0];
};

export const createCourse = async (data: Record<string, unknown>) => {
  await ensureCoursesMasterListTable();
  const r = await pool.query(
    `
    INSERT INTO courses_master_list (
      course_code, course_title, course_description,
      laboratory_units, academic_units_lecture, credited_units, lecture_hours, laboratory_hours,
      general_education, major_course, elective_course, computer_course, e_learning,
      course_with_internet, include_in_gwa, non_academic_course, club_organization_course,
      from_other_school, use_transmuted_grade, is_inactive,
      code_alias_1, code_alias_2, parent_code, course_level, course_area, course_mode,
      default_min_class_limit, default_max_class_limit, is_locked_subject
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,$27,$28,$29
    )
    RETURNING *
    `,
    [
      data.course_code,
      data.course_title,
      data.course_description ?? null,
      data.laboratory_units ?? 0,
      data.academic_units_lecture ?? 0,
      data.credited_units ?? 0,
      data.lecture_hours ?? 0,
      data.laboratory_hours ?? 0,
      !!data.general_education,
      !!data.major_course,
      !!data.elective_course,
      !!data.computer_course,
      !!data.e_learning,
      !!data.course_with_internet,
      !!data.include_in_gwa,
      !!data.non_academic_course,
      !!data.club_organization_course,
      !!data.from_other_school,
      !!data.use_transmuted_grade,
      !!data.is_inactive,
      data.code_alias_1 ?? null,
      data.code_alias_2 ?? null,
      data.parent_code ?? null,
      data.course_level ?? null,
      data.course_area ?? null,
      data.course_mode ?? null,
      data.default_min_class_limit ?? null,
      data.default_max_class_limit ?? null,
      !!data.is_locked_subject,
    ]
  );
  return r.rows[0];
};

export const updateCourse = async (id: number, data: Record<string, unknown>) => {
  await ensureCoursesMasterListTable();
  const r = await pool.query(
    `
    UPDATE courses_master_list
    SET
      course_code = $1,
      course_title = $2,
      course_description = $3,
      laboratory_units = $4,
      academic_units_lecture = $5,
      credited_units = $6,
      lecture_hours = $7,
      laboratory_hours = $8,
      general_education = $9,
      major_course = $10,
      elective_course = $11,
      computer_course = $12,
      e_learning = $13,
      course_with_internet = $14,
      include_in_gwa = $15,
      non_academic_course = $16,
      club_organization_course = $17,
      from_other_school = $18,
      use_transmuted_grade = $19,
      is_inactive = $20,
      code_alias_1 = $21,
      code_alias_2 = $22,
      parent_code = $23,
      course_level = $24,
      course_area = $25,
      course_mode = $26,
      default_min_class_limit = $27,
      default_max_class_limit = $28,
      is_locked_subject = $29,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $30
    RETURNING *
    `,
    [
      data.course_code,
      data.course_title,
      data.course_description ?? null,
      data.laboratory_units ?? 0,
      data.academic_units_lecture ?? 0,
      data.credited_units ?? 0,
      data.lecture_hours ?? 0,
      data.laboratory_hours ?? 0,
      !!data.general_education,
      !!data.major_course,
      !!data.elective_course,
      !!data.computer_course,
      !!data.e_learning,
      !!data.course_with_internet,
      !!data.include_in_gwa,
      !!data.non_academic_course,
      !!data.club_organization_course,
      !!data.from_other_school,
      !!data.use_transmuted_grade,
      !!data.is_inactive,
      data.code_alias_1 ?? null,
      data.code_alias_2 ?? null,
      data.parent_code ?? null,
      data.course_level ?? null,
      data.course_area ?? null,
      data.course_mode ?? null,
      data.default_min_class_limit ?? null,
      data.default_max_class_limit ?? null,
      !!data.is_locked_subject,
      id,
    ]
  );
  return r.rows[0];
};

export const deleteCourse = async (id: number) => {
  await ensureCoursesMasterListTable();
  const r = await pool.query(`DELETE FROM courses_master_list WHERE id = $1 RETURNING *`, [id]);
  return r.rows[0];
};

