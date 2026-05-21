import pool from "../db.js";
import { listGradingRows } from "./gradingSystem.service.js";
import {
  computeCorrectionMetrics,
  failingSubjectPercent,
  type CorrectionLineLike,
  type GradingRowLike,
} from "../lib/correctionMetrics.js";
import { lookupEnrollmentSnapshot, type EnrollmentSnapshot } from "./correctionOfGrades.service.js";
import { resolveScholasticDelinquency } from "./recalculateSummaryOfGrades.service.js";

const T = "grade_encoding_line";
const T_EVAL = "grade_encoding_evaluation_line";
const T_SETTINGS = "grade_encoding_student_settings";

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      student_no VARCHAR(64) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      course_code VARCHAR(64),
      course_title VARCHAR(300),
      class_section VARCHAR(64),
      unit NUMERIC(8,2) DEFAULT 0,
      lec_units NUMERIC(8,2) DEFAULT 0,
      lab_units NUMERIC(8,2) DEFAULT 0,
      midterm VARCHAR(32),
      final VARCHAR(32),
      re_exam VARCHAR(32),
      credited_units NUMERIC(8,2),
      remark VARCHAR(300),
      year_level VARCHAR(32),
      from_other_school BOOLEAN NOT NULL DEFAULT FALSE,
      date_entered DATE,
      date_posted DATE,
      subject_id VARCHAR(80),
      course_id VARCHAR(80),
      grade_id VARCHAR(120),
      grade_idx VARCHAR(80),
      schedule_id VARCHAR(80),
      type_of_grade VARCHAR(80),
      compute_gwa BOOLEAN NOT NULL DEFAULT TRUE,
      registration_id VARCHAR(80),
      status VARCHAR(80),
      show_in_tor BOOLEAN NOT NULL DEFAULT TRUE,
      not_credited BOOLEAN NOT NULL DEFAULT FALSE,
      is_summer_term BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_grade_encoding_line ON ${T} (academic_year_term_id, student_no)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_grade_encoding_line_student ON ${T} (student_no)`
  );
  await pool.query(`
    ALTER TABLE ${T}
      ADD COLUMN IF NOT EXISTS lec_units NUMERIC(8,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lab_units NUMERIC(8,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS course_id VARCHAR(80),
      ADD COLUMN IF NOT EXISTS grade_idx VARCHAR(80),
      ADD COLUMN IF NOT EXISTS schedule_id VARCHAR(80),
      ADD COLUMN IF NOT EXISTS show_in_tor BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS not_credited BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_summer_term BOOLEAN DEFAULT FALSE
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_EVAL} (
      id SERIAL PRIMARY KEY,
      student_no VARCHAR(64) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      year_term VARCHAR(120),
      course_code VARCHAR(64),
      course_title VARCHAR(300),
      unit NUMERIC(8,2) DEFAULT 0,
      final VARCHAR(32),
      re_exam VARCHAR(32),
      credited_units NUMERIC(8,2),
      remarks VARCHAR(500),
      pre_requisites VARCHAR(300),
      equivalent VARCHAR(300),
      year_standing VARCHAR(64),
      academic_year_term_taken VARCHAR(120),
      year_level_taken VARCHAR(32),
      from_other_school BOOLEAN NOT NULL DEFAULT FALSE,
      date_entered DATE,
      date_posted DATE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_grade_encoding_eval_student ON ${T_EVAL} (student_no)`
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_SETTINGS} (
      student_no VARCHAR(64) PRIMARY KEY,
      include_summer BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export type GradeEncodingLine = {
  id: number;
  academic_year_term_id: number;
  student_no: string;
  sort_order: number;
  course_code: string | null;
  course_title: string | null;
  class_section: string | null;
  unit: string | null;
  lec_units: string | null;
  lab_units: string | null;
  midterm: string | null;
  final: string | null;
  re_exam: string | null;
  credited_units: string | null;
  remark: string | null;
  year_level: string | null;
  from_other_school: boolean;
  date_entered: string | null;
  date_posted: string | null;
  subject_id: string | null;
  course_id: string | null;
  grade_id: string | null;
  grade_idx: string | null;
  schedule_id: string | null;
  type_of_grade: string | null;
  compute_gwa: boolean;
  registration_id: string | null;
  status: string | null;
  show_in_tor: boolean;
  not_credited: boolean;
  is_summer_term: boolean;
};

export type ReportOfGradesLine = GradeEncodingLine & {
  academic_year_term_label: string;
};

export type TranscriptLine = ReportOfGradesLine;

export type EvaluationLine = {
  id: number;
  student_no: string;
  sort_order: number;
  year_term: string | null;
  course_code: string | null;
  course_title: string | null;
  unit: string | null;
  final: string | null;
  re_exam: string | null;
  credited_units: string | null;
  remarks: string | null;
  pre_requisites: string | null;
  equivalent: string | null;
  year_standing: string | null;
  academic_year_term_taken: string | null;
  year_level_taken: string | null;
  from_other_school: boolean;
  date_entered: string | null;
  date_posted: string | null;
};

export type GradeEncodingProfile = {
  last_name: string;
  first_name: string;
  middle_name: string;
  mi: string;
  ext_name: string;
  gender: string;
  age: string;
  campus: string;
  college: string;
  academic_program: string;
  major_study: string;
  year_level: string;
  curriculum: string;
  date_graduated: string;
};

export type GradeEncodingWorkspace = {
  enrollment_snapshot: EnrollmentSnapshot | null;
  profile: GradeEncodingProfile;
  lines: GradeEncodingLine[];
  report_of_grades: ReportOfGradesLine[];
  evaluation_lines: EvaluationLine[];
  transcript_lines: TranscriptLine[];
  include_summer: boolean;
  metrics: {
    total_subjects: number;
    total_units_enrolled: number;
    total_units_earned: number;
    gwa: number | null;
  };
  scholastic_status: string;
  grading_context: { grade_level: string; format_key: string };
};

function dOnly(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function mapLine(r: Record<string, unknown>): GradeEncodingLine {
  return {
    id: Number(r.id),
    academic_year_term_id: Number(r.academic_year_term_id),
    student_no: String(r.student_no),
    sort_order: Number(r.sort_order ?? 0),
    course_code: r.course_code == null ? null : String(r.course_code),
    course_title: r.course_title == null ? null : String(r.course_title),
    class_section: r.class_section == null ? null : String(r.class_section),
    unit: r.unit == null ? null : String(r.unit),
    lec_units: r.lec_units == null ? null : String(r.lec_units),
    lab_units: r.lab_units == null ? null : String(r.lab_units),
    midterm: r.midterm == null ? null : String(r.midterm),
    final: r.final == null ? null : String(r.final),
    re_exam: r.re_exam == null ? null : String(r.re_exam),
    credited_units: r.credited_units == null ? null : String(r.credited_units),
    remark: r.remark == null ? null : String(r.remark),
    year_level: r.year_level == null ? null : String(r.year_level),
    from_other_school: Boolean(r.from_other_school),
    date_entered: dOnly(r.date_entered),
    date_posted: dOnly(r.date_posted),
    subject_id: r.subject_id == null ? null : String(r.subject_id),
    course_id: r.course_id == null ? null : String(r.course_id),
    grade_id: r.grade_id == null ? null : String(r.grade_id),
    grade_idx: r.grade_idx == null ? null : String(r.grade_idx),
    schedule_id: r.schedule_id == null ? null : String(r.schedule_id),
    type_of_grade: r.type_of_grade == null ? null : String(r.type_of_grade),
    compute_gwa: Boolean(r.compute_gwa ?? true),
    registration_id: r.registration_id == null ? null : String(r.registration_id),
    status: r.status == null ? null : String(r.status),
    show_in_tor: r.show_in_tor == null ? true : Boolean(r.show_in_tor),
    not_credited: Boolean(r.not_credited),
    is_summer_term: Boolean(r.is_summer_term),
  };
}

function mapEvalLine(r: Record<string, unknown>): EvaluationLine {
  return {
    id: Number(r.id),
    student_no: String(r.student_no),
    sort_order: Number(r.sort_order ?? 0),
    year_term: r.year_term == null ? null : String(r.year_term),
    course_code: r.course_code == null ? null : String(r.course_code),
    course_title: r.course_title == null ? null : String(r.course_title),
    unit: r.unit == null ? null : String(r.unit),
    final: r.final == null ? null : String(r.final),
    re_exam: r.re_exam == null ? null : String(r.re_exam),
    credited_units: r.credited_units == null ? null : String(r.credited_units),
    remarks: r.remarks == null ? null : String(r.remarks),
    pre_requisites: r.pre_requisites == null ? null : String(r.pre_requisites),
    equivalent: r.equivalent == null ? null : String(r.equivalent),
    year_standing: r.year_standing == null ? null : String(r.year_standing),
    academic_year_term_taken: r.academic_year_term_taken == null ? null : String(r.academic_year_term_taken),
    year_level_taken: r.year_level_taken == null ? null : String(r.year_level_taken),
    from_other_school: Boolean(r.from_other_school),
    date_entered: dOnly(r.date_entered),
    date_posted: dOnly(r.date_posted),
  };
}

function termLabel(academicYear: string, term: string): string {
  return `${academicYear} ${term}`.trim();
}

function isSummerTerm(term: string, flag: boolean): boolean {
  if (flag) return true;
  return /summer/i.test(term);
}

async function getIncludeSummer(studentNo: string): Promise<boolean> {
  await ensureTable();
  const { rows } = await pool.query(`SELECT include_summer FROM ${T_SETTINGS} WHERE student_no = $1`, [
    studentNo.trim(),
  ]);
  return Boolean(rows[0]?.include_summer);
}

async function listAllGradeLinesForStudent(
  studentNo: string,
  includeSummer: boolean
): Promise<ReportOfGradesLine[]> {
  await ensureTable();
  const sn = studentNo.trim();
  const { rows } = await pool.query(
    `
    SELECT g.*, t.academic_year, t.term
    FROM ${T} g
    LEFT JOIN academic_year_terms t ON t.id = g.academic_year_term_id
    WHERE g.student_no = $1
    ORDER BY t.academic_year DESC, t.term DESC, g.sort_order ASC, g.id ASC
  `,
    [sn]
  );
  return rows
    .map((row) => {
      const base = mapLine(row as Record<string, unknown>);
      const ay = row.academic_year == null ? "" : String(row.academic_year);
      const tm = row.term == null ? "" : String(row.term);
      const label = termLabel(ay, tm);
      return {
        ...base,
        academic_year_term_label: label,
      };
    })
    .filter((r) => includeSummer || !isSummerTerm(r.academic_year_term_label, r.is_summer_term));
}

async function listEvaluationForStudent(studentNo: string): Promise<EvaluationLine[]> {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM ${T_EVAL} WHERE student_no = $1 ORDER BY sort_order ASC, id ASC`,
    [studentNo.trim()]
  );
  return rows.map((row) => mapEvalLine(row as Record<string, unknown>));
}

async function listTranscriptForStudent(
  studentNo: string,
  includeSummer: boolean
): Promise<TranscriptLine[]> {
  return listAllGradeLinesForStudent(studentNo, includeSummer);
}

function parseStudentName(full: string | null | undefined): { last: string; first: string; middle: string } {
  const s = (full ?? "").trim();
  if (!s) return { last: "", first: "", middle: "" };
  const comma = s.indexOf(",");
  if (comma >= 0) {
    const last = s.slice(0, comma).trim();
    const rest = s.slice(comma + 1).trim().split(/\s+/).filter(Boolean);
    const first = rest[0] ?? "";
    const middle = rest.slice(1).join(" ");
    return { last, first, middle };
  }
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { last: parts[0], first: "", middle: "" };
  return { last: parts[parts.length - 1] ?? "", first: parts[0] ?? "", middle: parts.slice(1, -1).join(" ") };
}

function emptyProfile(): GradeEncodingProfile {
  return {
    last_name: "",
    first_name: "",
    middle_name: "",
    mi: "",
    ext_name: "",
    gender: "",
    age: "",
    campus: "",
    college: "",
    academic_program: "",
    major_study: "",
    year_level: "",
    curriculum: "",
    date_graduated: "",
  };
}

function buildProfile(snap: EnrollmentSnapshot | null): GradeEncodingProfile {
  const p = emptyProfile();
  if (!snap) return p;
  const { last, first, middle } = parseStudentName(snap.student_name);
  p.last_name = last;
  p.first_name = first;
  p.middle_name = middle;
  p.mi = middle ? middle.charAt(0) : "";
  p.campus = snap.campus ?? "";
  p.college = snap.college ?? "";
  p.academic_program = snap.program ?? "";
  p.year_level = snap.year_level ?? "";
  return p;
}

function linesToMetricsInput(lines: GradeEncodingLine[]): CorrectionLineLike[] {
  return lines.map((r) => ({
    credit_units: r.credited_units ?? r.unit,
    midterm: r.midterm,
    final: r.final,
    re_exam: r.re_exam,
    remarks: r.remark,
  }));
}

async function buildWorkspace(
  academicYearTermId: number,
  studentNo: string,
  gradeLevel: string,
  formatKey: string
): Promise<GradeEncodingWorkspace> {
  await ensureTable();
  const sn = studentNo.trim();
  const enrollment_snapshot = await lookupEnrollmentSnapshot(academicYearTermId, sn);
  const profile = buildProfile(enrollment_snapshot);
  const { rows } = await pool.query(
    `SELECT * FROM ${T} WHERE academic_year_term_id = $1 AND student_no = $2 ORDER BY sort_order ASC, id ASC`,
    [academicYearTermId, sn]
  );
  const lines = rows.map((row) => mapLine(row as Record<string, unknown>));
  const gl = gradeLevel.trim() || "College";
  const fk = formatKey.trim() || "format_1";
  const gradingFull = await listGradingRows(gl, fk);
  const gradingSlice: GradingRowLike[] = gradingFull.map((r) => ({
    grade_point: r.grade_point,
    letter_grade: r.letter_grade,
    credit_unit: r.credit_unit,
    compute_gwa: r.compute_gwa,
  }));
  const like = linesToMetricsInput(lines);
  const metrics = computeCorrectionMetrics(like, gradingSlice);
  const pctFail = failingSubjectPercent(like, gradingSlice);
  const scholastic_status = await resolveScholasticDelinquency(metrics.total_units_enrolled, pctFail);
  const include_summer = await getIncludeSummer(sn);
  const report_of_grades = await listAllGradeLinesForStudent(sn, include_summer);
  const evaluation_lines = await listEvaluationForStudent(sn);
  const transcript_lines = await listTranscriptForStudent(sn, include_summer);
  return {
    enrollment_snapshot,
    profile,
    lines,
    report_of_grades,
    evaluation_lines,
    transcript_lines,
    include_summer,
    metrics,
    scholastic_status,
    grading_context: { grade_level: gl, format_key: fk },
  };
}

export async function getGradeEncodingWorkspace(
  academicYearTermId: number,
  studentNo: string,
  opts?: { gradeLevel?: string; formatKey?: string }
): Promise<GradeEncodingWorkspace> {
  return buildWorkspace(
    academicYearTermId,
    studentNo,
    opts?.gradeLevel ?? "College",
    opts?.formatKey ?? "format_1"
  );
}

export type GradeEncodingLineInput = {
  course_code?: string | null;
  course_title?: string | null;
  class_section?: string | null;
  unit?: number | string | null;
  lec_units?: number | string | null;
  lab_units?: number | string | null;
  midterm?: string | null;
  final?: string | null;
  re_exam?: string | null;
  credited_units?: number | string | null;
  remark?: string | null;
  year_level?: string | null;
  from_other_school?: boolean | null;
  date_entered?: string | null;
  date_posted?: string | null;
  subject_id?: string | null;
  course_id?: string | null;
  grade_id?: string | null;
  grade_idx?: string | null;
  schedule_id?: string | null;
  type_of_grade?: string | null;
  compute_gwa?: boolean | null;
  registration_id?: string | null;
  status?: string | null;
  show_in_tor?: boolean | null;
  not_credited?: boolean | null;
  is_summer_term?: boolean | null;
  sort_order?: number | null;
};

export type EvaluationLineInput = {
  year_term?: string | null;
  course_code?: string | null;
  course_title?: string | null;
  unit?: number | string | null;
  final?: string | null;
  re_exam?: string | null;
  credited_units?: number | string | null;
  remarks?: string | null;
  pre_requisites?: string | null;
  equivalent?: string | null;
  year_standing?: string | null;
  academic_year_term_taken?: string | null;
  year_level_taken?: string | null;
  from_other_school?: boolean | null;
  date_entered?: string | null;
  date_posted?: string | null;
  sort_order?: number | null;
};

export type TranscriptFlagInput = {
  id: number;
  show_in_tor?: boolean | null;
  not_credited?: boolean | null;
};

export async function saveGradeEncodingWorkspace(
  academicYearTermId: number,
  studentNo: string,
  rows: GradeEncodingLineInput[],
  opts?: { gradeLevel?: string; formatKey?: string }
): Promise<GradeEncodingWorkspace> {
  await ensureTable();
  const sn = studentNo.trim();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${T} WHERE academic_year_term_id = $1 AND student_no = $2`, [
      academicYearTermId,
      sn,
    ]);
    let order = 0;
    for (const r of rows) {
      const u = r.unit == null || r.unit === "" ? 0 : Number(r.unit);
      const lec = r.lec_units == null || r.lec_units === "" ? u : Number(r.lec_units);
      const lab = r.lab_units == null || r.lab_units === "" ? 0 : Number(r.lab_units);
      const cu = r.credited_units == null || r.credited_units === "" ? null : Number(r.credited_units);
      await client.query(
        `
        INSERT INTO ${T} (
          academic_year_term_id, student_no, sort_order,
          course_code, course_title, class_section, unit, lec_units, lab_units,
          midterm, final, re_exam, credited_units, remark, year_level, from_other_school,
          date_entered, date_posted, subject_id, course_id, grade_id, grade_idx, schedule_id,
          type_of_grade, compute_gwa, registration_id, status, show_in_tor, not_credited, is_summer_term
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
        )
      `,
        [
          academicYearTermId,
          sn,
          Number(r.sort_order ?? order) || order,
          r.course_code == null ? null : String(r.course_code).slice(0, 64),
          r.course_title == null ? null : String(r.course_title).slice(0, 300),
          r.class_section == null ? null : String(r.class_section).slice(0, 64),
          Number.isFinite(u) ? u : 0,
          Number.isFinite(lec) ? lec : 0,
          Number.isFinite(lab) ? lab : 0,
          r.midterm == null ? null : String(r.midterm).slice(0, 32),
          r.final == null ? null : String(r.final).slice(0, 32),
          r.re_exam == null ? null : String(r.re_exam).slice(0, 32),
          cu != null && Number.isFinite(cu) ? cu : null,
          r.remark == null ? null : String(r.remark).slice(0, 300),
          r.year_level == null ? null : String(r.year_level).slice(0, 32),
          Boolean(r.from_other_school),
          r.date_entered == null || String(r.date_entered).trim() === "" ? null : String(r.date_entered).slice(0, 10),
          r.date_posted == null || String(r.date_posted).trim() === "" ? null : String(r.date_posted).slice(0, 10),
          r.subject_id == null ? null : String(r.subject_id).slice(0, 80),
          r.course_id == null ? null : String(r.course_id).slice(0, 80),
          r.grade_id == null ? null : String(r.grade_id).slice(0, 120),
          r.grade_idx == null ? null : String(r.grade_idx).slice(0, 80),
          r.schedule_id == null ? null : String(r.schedule_id).slice(0, 80),
          r.type_of_grade == null ? null : String(r.type_of_grade).slice(0, 80),
          r.compute_gwa !== false,
          r.registration_id == null ? null : String(r.registration_id).slice(0, 80),
          r.status == null ? null : String(r.status).slice(0, 80),
          r.show_in_tor !== false,
          Boolean(r.not_credited),
          Boolean(r.is_summer_term),
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
  return buildWorkspace(academicYearTermId, sn, opts?.gradeLevel ?? "College", opts?.formatKey ?? "format_1");
}

export async function saveEvaluationLines(
  studentNo: string,
  rows: EvaluationLineInput[],
  opts?: { academicYearTermId?: number; gradeLevel?: string; formatKey?: string }
): Promise<GradeEncodingWorkspace> {
  await ensureTable();
  const sn = studentNo.trim();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${T_EVAL} WHERE student_no = $1`, [sn]);
    let order = 0;
    for (const r of rows) {
      const u = r.unit == null || r.unit === "" ? 0 : Number(r.unit);
      const cu = r.credited_units == null || r.credited_units === "" ? null : Number(r.credited_units);
      await client.query(
        `
        INSERT INTO ${T_EVAL} (
          student_no, sort_order, year_term, course_code, course_title, unit,
          final, re_exam, credited_units, remarks, pre_requisites, equivalent, year_standing,
          academic_year_term_taken, year_level_taken, from_other_school, date_entered, date_posted
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      `,
        [
          sn,
          Number(r.sort_order ?? order) || order,
          r.year_term == null ? null : String(r.year_term).slice(0, 120),
          r.course_code == null ? null : String(r.course_code).slice(0, 64),
          r.course_title == null ? null : String(r.course_title).slice(0, 300),
          Number.isFinite(u) ? u : 0,
          r.final == null ? null : String(r.final).slice(0, 32),
          r.re_exam == null ? null : String(r.re_exam).slice(0, 32),
          cu != null && Number.isFinite(cu) ? cu : null,
          r.remarks == null ? null : String(r.remarks).slice(0, 500),
          r.pre_requisites == null ? null : String(r.pre_requisites).slice(0, 300),
          r.equivalent == null ? null : String(r.equivalent).slice(0, 300),
          r.year_standing == null ? null : String(r.year_standing).slice(0, 64),
          r.academic_year_term_taken == null ? null : String(r.academic_year_term_taken).slice(0, 120),
          r.year_level_taken == null ? null : String(r.year_level_taken).slice(0, 32),
          Boolean(r.from_other_school),
          r.date_entered == null || String(r.date_entered).trim() === "" ? null : String(r.date_entered).slice(0, 10),
          r.date_posted == null || String(r.date_posted).trim() === "" ? null : String(r.date_posted).slice(0, 10),
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
  const termId = opts?.academicYearTermId;
  if (termId == null || !Number.isFinite(termId)) {
    const { rows: trows } = await pool.query(`SELECT id FROM academic_year_terms ORDER BY id DESC LIMIT 1`);
    const fallback = Number(trows[0]?.id ?? 1);
    return buildWorkspace(fallback, sn, opts?.gradeLevel ?? "College", opts?.formatKey ?? "format_1");
  }
  return buildWorkspace(termId, sn, opts?.gradeLevel ?? "College", opts?.formatKey ?? "format_1");
}

export async function saveIncludeSummerSetting(
  studentNo: string,
  includeSummer: boolean,
  opts?: { academicYearTermId: number; gradeLevel?: string; formatKey?: string }
): Promise<GradeEncodingWorkspace> {
  await ensureTable();
  const sn = studentNo.trim();
  await pool.query(
    `
    INSERT INTO ${T_SETTINGS} (student_no, include_summer)
    VALUES ($1, $2)
    ON CONFLICT (student_no) DO UPDATE SET include_summer = EXCLUDED.include_summer, updated_at = CURRENT_TIMESTAMP
  `,
    [sn, Boolean(includeSummer)]
  );
  return buildWorkspace(
    opts.academicYearTermId,
    sn,
    opts?.gradeLevel ?? "College",
    opts?.formatKey ?? "format_1"
  );
}

export async function saveTranscriptFlags(
  studentNo: string,
  flags: TranscriptFlagInput[],
  opts: { academicYearTermId: number; gradeLevel?: string; formatKey?: string }
): Promise<GradeEncodingWorkspace> {
  await ensureTable();
  const sn = studentNo.trim();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const f of flags) {
      if (!Number.isFinite(f.id) || f.id <= 0) continue;
      await client.query(
        `
        UPDATE ${T}
        SET show_in_tor = COALESCE($3, show_in_tor),
            not_credited = COALESCE($4, not_credited),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND student_no = $2
      `,
        [
          f.id,
          sn,
          f.show_in_tor == null ? null : Boolean(f.show_in_tor),
          f.not_credited == null ? null : Boolean(f.not_credited),
        ]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return buildWorkspace(
    opts.academicYearTermId,
    sn,
    opts?.gradeLevel ?? "College",
    opts?.formatKey ?? "format_1"
  );
}
