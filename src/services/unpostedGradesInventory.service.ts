import pool from "../db.js";

const T = "unposted_grades_inventory";

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      campus VARCHAR(200) NOT NULL,
      college_code VARCHAR(32) NOT NULL,
      program_code VARCHAR(64),
      year_level VARCHAR(32),
      grade_idx VARCHAR(64),
      student_no VARCHAR(64),
      student_name VARCHAR(240),
      college VARCHAR(120),
      program VARCHAR(240),
      year_level_display VARCHAR(64),
      course_code VARCHAR(64),
      course_title VARCHAR(300),
      class_section VARCHAR(64),
      midterm VARCHAR(32),
      final VARCHAR(32),
      remarks VARCHAR(300),
      reg_id VARCHAR(80),
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_unposted_grades_inv_lookup ON ${T} (academic_year_term_id, campus, college_code)`
  );
};

export type UnpostedGradeRow = {
  id: number;
  academic_year_term_id: number;
  campus: string | null;
  college_code: string | null;
  program_code: string | null;
  year_level: string | null;
  grade_idx: string | null;
  student_no: string | null;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level_display: string | null;
  course_code: string | null;
  course_title: string | null;
  class_section: string | null;
  midterm: string | null;
  final: string | null;
  remarks: string | null;
  reg_id: string | null;
  sort_order: number;
};

function mapRow(r: Record<string, unknown>): UnpostedGradeRow {
  return {
    id: Number(r.id),
    academic_year_term_id: Number(r.academic_year_term_id),
    campus: r.campus == null ? null : String(r.campus),
    college_code: r.college_code == null ? null : String(r.college_code),
    program_code: r.program_code == null ? null : String(r.program_code),
    year_level: r.year_level == null ? null : String(r.year_level),
    grade_idx: r.grade_idx == null ? null : String(r.grade_idx),
    student_no: r.student_no == null ? null : String(r.student_no),
    student_name: r.student_name == null ? null : String(r.student_name),
    college: r.college == null ? null : String(r.college),
    program: r.program == null ? null : String(r.program),
    year_level_display: r.year_level_display == null ? null : String(r.year_level_display),
    course_code: r.course_code == null ? null : String(r.course_code),
    course_title: r.course_title == null ? null : String(r.course_title),
    class_section: r.class_section == null ? null : String(r.class_section),
    midterm: r.midterm == null ? null : String(r.midterm),
    final: r.final == null ? null : String(r.final),
    remarks: r.remarks == null ? null : String(r.remarks),
    reg_id: r.reg_id == null ? null : String(r.reg_id),
    sort_order: Number(r.sort_order ?? 0),
  };
}

export async function listUnpostedGrades(
  academicYearTermId: number,
  campus: string,
  collegeCode: string,
  programCode: string,
  yearLevel: string
): Promise<UnpostedGradeRow[]> {
  await ensureTable();
  const params: Array<string | number> = [academicYearTermId, campus.trim(), collegeCode.trim().toUpperCase()];
  let q = `
    SELECT * FROM ${T}
    WHERE academic_year_term_id = $1 AND campus = $2 AND UPPER(TRIM(college_code)) = $3
  `;
  let p = 4;
  const pc = programCode.trim();
  if (pc) {
    q += ` AND UPPER(TRIM(COALESCE(program_code, ''))) = $${p}`;
    params.push(pc.toUpperCase());
    p++;
  }
  const yl = yearLevel.trim();
  if (yl) {
    q += ` AND TRIM(COALESCE(year_level, '')) = $${p}`;
    params.push(yl);
    p++;
  }
  q += ` ORDER BY sort_order ASC, id ASC`;
  const { rows } = await pool.query(q, params);
  return rows.map((row) => mapRow(row as Record<string, unknown>));
}

export type UnpostedGradeInput = {
  program_code?: string | null;
  year_level?: string | null;
  grade_idx?: string | null;
  student_no?: string | null;
  student_name?: string | null;
  college?: string | null;
  program?: string | null;
  year_level_display?: string | null;
  course_code?: string | null;
  course_title?: string | null;
  class_section?: string | null;
  midterm?: string | null;
  final?: string | null;
  remarks?: string | null;
  reg_id?: string | null;
  sort_order?: number | null;
};

export async function replaceUnpostedGrades(
  academicYearTermId: number,
  campus: string,
  collegeCode: string,
  rows: UnpostedGradeInput[]
): Promise<UnpostedGradeRow[]> {
  await ensureTable();
  const c = campus.trim();
  const cc = collegeCode.trim().toUpperCase();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM ${T} WHERE academic_year_term_id = $1 AND campus = $2 AND UPPER(TRIM(college_code)) = $3`,
      [academicYearTermId, c, cc]
    );
    let order = 0;
    for (const r of rows) {
      await client.query(
        `
        INSERT INTO ${T} (
          academic_year_term_id, campus, college_code, program_code, year_level,
          grade_idx, student_no, student_name, college, program, year_level_display,
          course_code, course_title, class_section, midterm, final, remarks, reg_id, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `,
        [
          academicYearTermId,
          c,
          cc,
          r.program_code == null || String(r.program_code).trim() === "" ? null : String(r.program_code).slice(0, 64),
          r.year_level == null || String(r.year_level).trim() === "" ? null : String(r.year_level).slice(0, 32),
          r.grade_idx == null ? null : String(r.grade_idx).slice(0, 64),
          r.student_no == null ? null : String(r.student_no).slice(0, 64),
          r.student_name == null ? null : String(r.student_name).slice(0, 240),
          r.college == null ? null : String(r.college).slice(0, 120),
          r.program == null ? null : String(r.program).slice(0, 240),
          r.year_level_display == null ? null : String(r.year_level_display).slice(0, 64),
          r.course_code == null ? null : String(r.course_code).slice(0, 64),
          r.course_title == null ? null : String(r.course_title).slice(0, 300),
          r.class_section == null ? null : String(r.class_section).slice(0, 64),
          r.midterm == null ? null : String(r.midterm).slice(0, 32),
          r.final == null ? null : String(r.final).slice(0, 32),
          r.remarks == null ? null : String(r.remarks).slice(0, 300),
          r.reg_id == null ? null : String(r.reg_id).slice(0, 80),
          Number(r.sort_order ?? order) || order,
        ]
      );
      order += 1;
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return listUnpostedGrades(academicYearTermId, c, cc, "", "");
}
