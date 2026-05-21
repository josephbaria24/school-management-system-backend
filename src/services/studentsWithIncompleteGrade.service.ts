import pool from "../db.js";

const T_LINE = "incomplete_grade_line";
const T_CFG = "incomplete_grade_settings";

const ensureTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_CFG} (
      academic_year_term_id INT NOT NULL,
      campus_id INT NOT NULL,
      inc_due_date DATE,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (academic_year_term_id, campus_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_LINE} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      campus_id INT NOT NULL,
      reg_id VARCHAR(80),
      student_no VARCHAR(64) NOT NULL,
      student_name VARCHAR(240),
      college_code VARCHAR(32),
      course VARCHAR(300),
      major_study VARCHAR(300),
      year_level VARCHAR(32),
      subject_code VARCHAR(64),
      subject_title VARCHAR(300),
      lec_units NUMERIC(8,2) DEFAULT 0,
      lab_units NUMERIC(8,2) DEFAULT 0,
      credit_units NUMERIC(8,2) DEFAULT 0,
      final VARCHAR(32),
      re_exam_completed VARCHAR(120),
      remarks VARCHAR(500),
      sched_id VARCHAR(80),
      faculty_name VARCHAR(240),
      date_encoded DATE,
      posted_date DATE,
      regtabid VARCHAR(120),
      inc_status VARCHAR(80),
      grade_id VARCHAR(120),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_incomplete_grade_line_lookup ON ${T_LINE} (academic_year_term_id, campus_id)`
  );
};

export type IncompleteGradeLine = {
  id: number;
  academic_year_term_id: number;
  campus_id: number;
  reg_id: string | null;
  student_no: string;
  student_name: string | null;
  college_code: string | null;
  course: string | null;
  major_study: string | null;
  year_level: string | null;
  subject_code: string | null;
  subject_title: string | null;
  lec_units: string | null;
  lab_units: string | null;
  credit_units: string | null;
  final: string | null;
  re_exam_completed: string | null;
  remarks: string | null;
  sched_id: string | null;
  faculty_name: string | null;
  date_encoded: string | null;
  posted_date: string | null;
  regtabid: string | null;
  inc_status: string | null;
  grade_id: string | null;
};

function mapLine(r: Record<string, unknown>): IncompleteGradeLine {
  const d = (v: unknown) =>
    v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
  return {
    id: Number(r.id),
    academic_year_term_id: Number(r.academic_year_term_id),
    campus_id: Number(r.campus_id),
    reg_id: r.reg_id == null ? null : String(r.reg_id),
    student_no: String(r.student_no),
    student_name: r.student_name == null ? null : String(r.student_name),
    college_code: r.college_code == null ? null : String(r.college_code),
    course: r.course == null ? null : String(r.course),
    major_study: r.major_study == null ? null : String(r.major_study),
    year_level: r.year_level == null ? null : String(r.year_level),
    subject_code: r.subject_code == null ? null : String(r.subject_code),
    subject_title: r.subject_title == null ? null : String(r.subject_title),
    lec_units: r.lec_units == null ? null : String(r.lec_units),
    lab_units: r.lab_units == null ? null : String(r.lab_units),
    credit_units: r.credit_units == null ? null : String(r.credit_units),
    final: r.final == null ? null : String(r.final),
    re_exam_completed: r.re_exam_completed == null ? null : String(r.re_exam_completed),
    remarks: r.remarks == null ? null : String(r.remarks),
    sched_id: r.sched_id == null ? null : String(r.sched_id),
    faculty_name: r.faculty_name == null ? null : String(r.faculty_name),
    date_encoded: d(r.date_encoded),
    posted_date: d(r.posted_date),
    regtabid: r.regtabid == null ? null : String(r.regtabid),
    inc_status: r.inc_status == null ? null : String(r.inc_status),
    grade_id: r.grade_id == null ? null : String(r.grade_id),
  };
}

export type IncompleteGradeListResult = {
  inc_due_date: string | null;
  rows: IncompleteGradeLine[];
};

export async function getIncDueDateSetting(
  academicYearTermId: number,
  campusId: number
): Promise<string | null> {
  await ensureTables();
  const { rows } = await pool.query(
    `SELECT inc_due_date FROM ${T_CFG} WHERE academic_year_term_id = $1 AND campus_id = $2`,
    [academicYearTermId, campusId]
  );
  if (!rows.length || rows[0].inc_due_date == null) return null;
  const v = rows[0].inc_due_date;
  return v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
}

export async function saveIncDueDateSetting(
  academicYearTermId: number,
  campusId: number,
  incDueDate: string | null
): Promise<string | null> {
  await ensureTables();
  const dateVal =
    incDueDate == null || String(incDueDate).trim() === "" ? null : String(incDueDate).slice(0, 10);
  await pool.query(
    `
    INSERT INTO ${T_CFG} (academic_year_term_id, campus_id, inc_due_date)
    VALUES ($1, $2, $3)
    ON CONFLICT (academic_year_term_id, campus_id) DO UPDATE SET
      inc_due_date = EXCLUDED.inc_due_date,
      updated_at = CURRENT_TIMESTAMP
  `,
    [academicYearTermId, campusId, dateVal]
  );
  return dateVal;
}

export async function listIncompleteGradeLines(
  academicYearTermId: number,
  campusId: number,
  opts?: { eligibleOnly?: boolean }
): Promise<IncompleteGradeListResult> {
  await ensureTables();
  const incDue = await getIncDueDateSetting(academicYearTermId, campusId);
  const eligibleOnly = opts?.eligibleOnly !== false;
  let sql = `
    SELECT * FROM ${T_LINE}
    WHERE academic_year_term_id = $1 AND campus_id = $2
      AND (
        UPPER(TRIM(COALESCE(final,''))) LIKE 'INC%'
        OR UPPER(TRIM(COALESCE(final,''))) LIKE '%INCOMPLETE%'
      )
  `;
  const params: Array<number | string> = [academicYearTermId, campusId];
  if (eligibleOnly && incDue) {
    sql += ` AND CURRENT_DATE > $3::date`;
    params.push(incDue);
  }
  sql += ` ORDER BY student_no ASC, subject_code ASC, id ASC`;
  const { rows } = await pool.query(sql, params);
  return {
    inc_due_date: incDue,
    rows: rows.map((row) => mapLine(row as Record<string, unknown>)),
  };
}

export async function convertIncToFailing(
  ids: number[],
  failingGrade: string,
  remarksAppend: string | null
): Promise<number> {
  await ensureTables();
  if (!ids.length) return 0;
  const fg = (failingGrade || "5.00").trim().slice(0, 32);
  const note = remarksAppend == null || remarksAppend.trim() === "" ? "Converted from INC" : remarksAppend.trim();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let n = 0;
    for (const id of ids) {
      const r = await client.query(
        `
        UPDATE ${T_LINE}
        SET
          final = $2,
          remarks = TRIM(BOTH ' ' FROM (COALESCE(remarks, '') || ' ' || $3::text)),
          inc_status = 'CONVERTED',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND (
            UPPER(TRIM(COALESCE(final,''))) LIKE 'INC%'
            OR UPPER(TRIM(COALESCE(final,''))) LIKE '%INCOMPLETE%'
          )
        RETURNING id
      `,
        [id, fg, note]
      );
      n += r.rowCount ?? 0;
    }
    await client.query("COMMIT");
    return n;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
