import pool from "../db.js";
import { listGradingRows } from "./gradingSystem.service.js";
import { computeCorrectionMetrics, type CorrectionMetrics } from "../lib/correctionMetrics.js";

export type EnrollmentSnapshot = {
  student_name: string | null;
  year_level: string | null;
  college: string | null;
  program: string | null;
  campus: string | null;
  registration_no: string | null;
  registration_date: string | null;
};

export type GradingContext = {
  grade_level: string;
  format_key: string;
};

function formatPgDate(d: unknown): string | null {
  if (d == null) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  const s = String(d);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export async function lookupEnrollmentSnapshot(
  academicYearTermId: number,
  studentNo: string
): Promise<EnrollmentSnapshot | null> {
  const sn = studentNo.trim();
  const out: EnrollmentSnapshot = {
    student_name: null,
    year_level: null,
    college: null,
    program: null,
    campus: null,
    registration_no: null,
    registration_date: null,
  };

  try {
    const r1 = await pool.query(
      `
      SELECT student_name, college, program, year_level_display, year_level, reg_id, campus
      FROM unposted_grades_inventory
      WHERE academic_year_term_id = $1
        AND student_no IS NOT NULL
        AND UPPER(TRIM(student_no)) = UPPER(TRIM($2))
      ORDER BY id ASC
      LIMIT 1
    `,
      [academicYearTermId, sn]
    );
    if (r1.rows.length) {
      const u = r1.rows[0] as Record<string, unknown>;
      out.student_name = u.student_name == null ? null : String(u.student_name);
      out.college = u.college == null ? null : String(u.college);
      out.program = u.program == null ? null : String(u.program);
      out.year_level =
        u.year_level_display != null && String(u.year_level_display).trim()
          ? String(u.year_level_display)
          : u.year_level == null
            ? null
            : String(u.year_level);
      out.registration_no = u.reg_id == null ? null : String(u.reg_id);
      out.campus = u.campus == null ? null : String(u.campus);
    }
  } catch {
    /* table may not exist yet */
  }

  try {
    const r2 = await pool.query(
      `
      SELECT student_name, reg_id, trans_date, classification
      FROM add_drop_transaction_list
      WHERE academic_year_term_id = $1
        AND student_no IS NOT NULL
        AND UPPER(TRIM(student_no)) = UPPER(TRIM($2))
      ORDER BY id ASC
      LIMIT 1
    `,
      [academicYearTermId, sn]
    );
    if (r2.rows.length) {
      const t = r2.rows[0] as Record<string, unknown>;
      out.student_name = out.student_name ?? (t.student_name == null ? null : String(t.student_name));
      out.registration_no = out.registration_no ?? (t.reg_id == null ? null : String(t.reg_id));
      out.registration_date = out.registration_date ?? formatPgDate(t.trans_date);
      out.year_level =
        out.year_level ?? (t.classification == null ? null : String(t.classification).trim() || null);
    }
  } catch {
    /* table may not exist yet */
  }

  const has =
    out.student_name ||
    out.year_level ||
    out.college ||
    out.program ||
    out.campus ||
    out.registration_no ||
    out.registration_date;
  return has ? out : null;
}

async function metricsForLines(
  lines: CorrectionGradesLine[],
  gradeLevel: string,
  formatKey: string
): Promise<{ metrics: CorrectionMetrics; grading_context: GradingContext }> {
  const gl = gradeLevel.trim() || "College";
  const fk = formatKey.trim() || "format_1";
  const gradingRows = await listGradingRows(gl, fk);
  const slice = gradingRows.map((r) => ({
    grade_point: r.grade_point,
    letter_grade: r.letter_grade,
    credit_unit: r.credit_unit,
    compute_gwa: r.compute_gwa,
  }));
  return {
    metrics: computeCorrectionMetrics(lines, slice),
    grading_context: { grade_level: gl, format_key: fk },
  };
}

const T_LINE = "correction_of_grades_line";
const T_SESSION = "correction_of_grades_session";

const ensureTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_SESSION} (
      academic_year_term_id INT NOT NULL,
      student_no VARCHAR(64) NOT NULL,
      registration_no VARCHAR(80),
      registration_date DATE,
      year_level VARCHAR(32),
      college VARCHAR(240),
      program VARCHAR(300),
      encoded_by VARCHAR(200),
      date_posted TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (academic_year_term_id, student_no)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_LINE} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      student_no VARCHAR(64) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      class_section VARCHAR(64),
      subject_code VARCHAR(64),
      subject_title VARCHAR(300),
      midterm VARCHAR(32),
      final VARCHAR(32),
      re_exam VARCHAR(32),
      remarks VARCHAR(300),
      credit_units NUMERIC(8,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_correction_grades_line ON ${T_LINE} (academic_year_term_id, student_no)`
  );
};

export type CorrectionGradesSession = {
  academic_year_term_id: number;
  student_no: string;
  registration_no: string | null;
  registration_date: string | null;
  year_level: string | null;
  college: string | null;
  program: string | null;
  encoded_by: string | null;
  date_posted: string | null;
};

export type CorrectionGradesLine = {
  id: number;
  academic_year_term_id: number;
  student_no: string;
  sort_order: number;
  class_section: string | null;
  subject_code: string | null;
  subject_title: string | null;
  midterm: string | null;
  final: string | null;
  re_exam: string | null;
  remarks: string | null;
  credit_units: string | null;
};

function mapSession(r: Record<string, unknown>): CorrectionGradesSession {
  return {
    academic_year_term_id: Number(r.academic_year_term_id),
    student_no: String(r.student_no),
    registration_no: r.registration_no == null ? null : String(r.registration_no),
    registration_date:
      r.registration_date == null
        ? null
        : r.registration_date instanceof Date
          ? r.registration_date.toISOString().slice(0, 10)
          : String(r.registration_date).slice(0, 10),
    year_level: r.year_level == null ? null : String(r.year_level),
    college: r.college == null ? null : String(r.college),
    program: r.program == null ? null : String(r.program),
    encoded_by: r.encoded_by == null ? null : String(r.encoded_by),
    date_posted:
      r.date_posted == null
        ? null
        : r.date_posted instanceof Date
          ? r.date_posted.toISOString()
          : String(r.date_posted),
  };
}

function mapLine(r: Record<string, unknown>): CorrectionGradesLine {
  return {
    id: Number(r.id),
    academic_year_term_id: Number(r.academic_year_term_id),
    student_no: String(r.student_no),
    sort_order: Number(r.sort_order ?? 0),
    class_section: r.class_section == null ? null : String(r.class_section),
    subject_code: r.subject_code == null ? null : String(r.subject_code),
    subject_title: r.subject_title == null ? null : String(r.subject_title),
    midterm: r.midterm == null ? null : String(r.midterm),
    final: r.final == null ? null : String(r.final),
    re_exam: r.re_exam == null ? null : String(r.re_exam),
    remarks: r.remarks == null ? null : String(r.remarks),
    credit_units: r.credit_units == null ? null : String(r.credit_units),
  };
}

export type CorrectionWorkspace = {
  session: CorrectionGradesSession | null;
  lines: CorrectionGradesLine[];
  enrollment_snapshot: EnrollmentSnapshot | null;
  metrics: CorrectionMetrics;
  grading_context: GradingContext;
};

export type CorrectionWorkspaceOptions = {
  gradeLevel?: string;
  formatKey?: string;
};

export async function getCorrectionWorkspace(
  academicYearTermId: number,
  studentNo: string,
  opts?: CorrectionWorkspaceOptions
): Promise<CorrectionWorkspace> {
  await ensureTables();
  const sn = studentNo.trim();
  const { rows: srows } = await pool.query(
    `SELECT * FROM ${T_SESSION} WHERE academic_year_term_id = $1 AND student_no = $2`,
    [academicYearTermId, sn]
  );
  const session = srows.length ? mapSession(srows[0] as Record<string, unknown>) : null;
  const { rows: lrows } = await pool.query(
    `SELECT * FROM ${T_LINE} WHERE academic_year_term_id = $1 AND student_no = $2 ORDER BY sort_order ASC, id ASC`,
    [academicYearTermId, sn]
  );
  const lines = lrows.map((row) => mapLine(row as Record<string, unknown>));
  const enrollment_snapshot = await lookupEnrollmentSnapshot(academicYearTermId, sn);
  const { metrics, grading_context } = await metricsForLines(
    lines,
    opts?.gradeLevel ?? "College",
    opts?.formatKey ?? "format_1"
  );
  return {
    session,
    lines,
    enrollment_snapshot,
    metrics,
    grading_context,
  };
}

export type CorrectionLineInput = {
  class_section?: string | null;
  subject_code?: string | null;
  subject_title?: string | null;
  midterm?: string | null;
  final?: string | null;
  re_exam?: string | null;
  remarks?: string | null;
  credit_units?: number | string | null;
  sort_order?: number | null;
};

export type CorrectionSessionInput = {
  registration_no?: string | null;
  registration_date?: string | null;
  year_level?: string | null;
  college?: string | null;
  program?: string | null;
  encoded_by?: string | null;
  date_posted?: string | null;
};

export async function saveCorrectionWorkspace(
  academicYearTermId: number,
  studentNo: string,
  session: CorrectionSessionInput | null | undefined,
  rows: CorrectionLineInput[],
  opts?: CorrectionWorkspaceOptions
): Promise<CorrectionWorkspace> {
  await ensureTables();
  const sn = studentNo.trim();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (session) {
      await client.query(
        `
        INSERT INTO ${T_SESSION} (
          academic_year_term_id, student_no, registration_no, registration_date,
          year_level, college, program, encoded_by, date_posted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (academic_year_term_id, student_no) DO UPDATE SET
          registration_no = EXCLUDED.registration_no,
          registration_date = EXCLUDED.registration_date,
          year_level = EXCLUDED.year_level,
          college = EXCLUDED.college,
          program = EXCLUDED.program,
          encoded_by = EXCLUDED.encoded_by,
          date_posted = EXCLUDED.date_posted,
          updated_at = CURRENT_TIMESTAMP
      `,
        [
          academicYearTermId,
          sn,
          session.registration_no == null || session.registration_no === ""
            ? null
            : String(session.registration_no).slice(0, 80),
          session.registration_date == null || String(session.registration_date).trim() === ""
            ? null
            : String(session.registration_date).slice(0, 10),
          session.year_level == null ? null : String(session.year_level).slice(0, 32),
          session.college == null ? null : String(session.college).slice(0, 240),
          session.program == null ? null : String(session.program).slice(0, 300),
          session.encoded_by == null ? null : String(session.encoded_by).slice(0, 200),
          session.date_posted == null || String(session.date_posted).trim() === ""
            ? null
            : String(session.date_posted),
        ]
      );
    }
    await client.query(`DELETE FROM ${T_LINE} WHERE academic_year_term_id = $1 AND student_no = $2`, [
      academicYearTermId,
      sn,
    ]);
    let order = 0;
    for (const r of rows) {
      const cu = r.credit_units == null || r.credit_units === "" ? 0 : Number(r.credit_units);
      await client.query(
        `
        INSERT INTO ${T_LINE} (
          academic_year_term_id, student_no, sort_order, class_section, subject_code, subject_title,
          midterm, final, re_exam, remarks, credit_units
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          academicYearTermId,
          sn,
          Number(r.sort_order ?? order) || order,
          r.class_section == null ? null : String(r.class_section).slice(0, 64),
          r.subject_code == null ? null : String(r.subject_code).slice(0, 64),
          r.subject_title == null ? null : String(r.subject_title).slice(0, 300),
          r.midterm == null ? null : String(r.midterm).slice(0, 32),
          r.final == null ? null : String(r.final).slice(0, 32),
          r.re_exam == null ? null : String(r.re_exam).slice(0, 32),
          r.remarks == null ? null : String(r.remarks).slice(0, 300),
          Number.isFinite(cu) ? cu : 0,
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
  return getCorrectionWorkspace(academicYearTermId, sn, opts);
}
