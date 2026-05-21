import pool from "../db.js";
import { listGradingRows } from "./gradingSystem.service.js";
import { listScholasticDelinquencyRules } from "./scholasticDelinquency.service.js";
import {
  computeCorrectionMetrics,
  failingSubjectPercent,
  type CorrectionLineLike,
  type GradingRowLike,
} from "../lib/correctionMetrics.js";

const T_SUMMARY = "student_grade_summary";
const T_CORR_LINE = "correction_of_grades_line";

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_SUMMARY} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      campus_id INT NOT NULL,
      college_code VARCHAR(32) NOT NULL DEFAULT '',
      reg_id VARCHAR(80),
      student_no VARCHAR(64) NOT NULL,
      student_name VARCHAR(240),
      college VARCHAR(240),
      program VARCHAR(300),
      year_level VARCHAR(32),
      enrolled_courses INT NOT NULL DEFAULT 0,
      credit_units_enrolled NUMERIC(10,2) NOT NULL DEFAULT 0,
      credit_units_earned NUMERIC(10,2) NOT NULL DEFAULT 0,
      gwa NUMERIC(8,4),
      qualified VARCHAR(8),
      remarks VARCHAR(500),
      scholastic_delinquency VARCHAR(240),
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (academic_year_term_id, campus_id, college_code, student_no)
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_student_grade_summary_lookup ON ${T_SUMMARY} (academic_year_term_id, campus_id, college_code)`
  );
};

export type StudentGradeSummaryRow = {
  id: number;
  academic_year_term_id: number;
  campus_id: number;
  college_code: string;
  reg_id: string | null;
  student_no: string;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
  enrolled_courses: number;
  credit_units_enrolled: string;
  credit_units_earned: string;
  gwa: string | null;
  qualified: string | null;
  remarks: string | null;
  scholastic_delinquency: string | null;
};

function mapSummary(r: Record<string, unknown>): StudentGradeSummaryRow {
  return {
    id: Number(r.id),
    academic_year_term_id: Number(r.academic_year_term_id),
    campus_id: Number(r.campus_id),
    college_code: r.college_code == null ? "" : String(r.college_code),
    reg_id: r.reg_id == null ? null : String(r.reg_id),
    student_no: String(r.student_no),
    student_name: r.student_name == null ? null : String(r.student_name),
    college: r.college == null ? null : String(r.college),
    program: r.program == null ? null : String(r.program),
    year_level: r.year_level == null ? null : String(r.year_level),
    enrolled_courses: Number(r.enrolled_courses ?? 0),
    credit_units_enrolled: r.credit_units_enrolled == null ? "0" : String(r.credit_units_enrolled),
    credit_units_earned: r.credit_units_earned == null ? "0" : String(r.credit_units_earned),
    gwa: r.gwa == null ? null : String(r.gwa),
    qualified: r.qualified == null ? null : String(r.qualified),
    remarks: r.remarks == null ? null : String(r.remarks),
    scholastic_delinquency: r.scholastic_delinquency == null ? null : String(r.scholastic_delinquency),
  };
}

export async function resolveScholasticDelinquency(unitsEnrolled: number, pctFailedSubjects: number): Promise<string> {
  const rules = await listScholasticDelinquencyRules();
  for (const rule of rules) {
    const minU = Number(rule.min_units_enrolled);
    const maxU = Number(rule.max_units_enrolled);
    const minP = Number(rule.min_percent_subject);
    const maxP = Number(rule.max_percent_subject);
    if (
      Number.isFinite(minU) &&
      Number.isFinite(maxU) &&
      unitsEnrolled >= minU &&
      unitsEnrolled <= maxU &&
      Number.isFinite(minP) &&
      Number.isFinite(maxP) &&
      pctFailedSubjects >= minP &&
      pctFailedSubjects <= maxP
    ) {
      return rule.status_text;
    }
  }
  return "Good standing";
}

async function fetchCorrectionLines(
  academicYearTermId: number,
  studentNo: string
): Promise<CorrectionLineLike[]> {
  try {
    const { rows } = await pool.query(
      `SELECT midterm, final, re_exam, remarks, credit_units
       FROM ${T_CORR_LINE}
       WHERE academic_year_term_id = $1 AND student_no = $2
       ORDER BY sort_order ASC, id ASC`,
      [academicYearTermId, studentNo.trim()]
    );
    return rows.map((row) => ({
      midterm: row.midterm,
      final: row.final,
      re_exam: row.re_exam,
      remarks: row.remarks,
      credit_units: row.credit_units,
    }));
  } catch {
    return [];
  }
}

async function recomputeOneSummaryRow(
  id: number,
  gradeLevel: string,
  formatKey: string
): Promise<void> {
  await ensureTable();
  const gl = gradeLevel.trim() || "College";
  const fk = formatKey.trim() || "format_1";
  const { rows: srows } = await pool.query(`SELECT * FROM ${T_SUMMARY} WHERE id = $1`, [id]);
  if (!srows.length) return;
  const meta = srows[0] as Record<string, unknown>;
  const termId = Number(meta.academic_year_term_id);
  const studentNo = String(meta.student_no);
  const lines = await fetchCorrectionLines(termId, studentNo);
  const gradingFull = await listGradingRows(gl, fk);
  const gradingRows: GradingRowLike[] = gradingFull.map((r) => ({
    grade_point: r.grade_point,
    letter_grade: r.letter_grade,
    credit_unit: r.credit_unit,
    compute_gwa: r.compute_gwa,
  }));
  const metrics = computeCorrectionMetrics(lines, gradingRows);
  const pctFail = failingSubjectPercent(lines, gradingRows);
    const schol = await resolveScholasticDelinquency(metrics.total_units_enrolled, pctFail);
  const gwaVal = metrics.gwa;
  const qualified =
    gwaVal != null && Number.isFinite(gwaVal) && gwaVal <= 3.0 ? "Y" : "N";

  await pool.query(
    `
    UPDATE ${T_SUMMARY}
    SET
      enrolled_courses = $2,
      credit_units_enrolled = $3,
      credit_units_earned = $4,
      gwa = $5,
      qualified = $6,
      scholastic_delinquency = $7,
      remarks = SUBSTRING(
        TRIM(BOTH ' ' FROM (
          COALESCE(remarks, '') || ' | Recalculated ' || CURRENT_DATE::TEXT
        )) FROM 1 FOR 500
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `,
    [
      id,
      metrics.total_subjects,
      metrics.total_units_enrolled,
      metrics.total_units_earned,
      gwaVal == null || !Number.isFinite(gwaVal) ? null : gwaVal,
      qualified,
      schol,
    ]
  );
}

export async function listStudentGradeSummaries(
  academicYearTermId: number,
  campusId: number,
  collegeCode: string
): Promise<StudentGradeSummaryRow[]> {
  await ensureTable();
  const cc = collegeCode.trim().toUpperCase();
  let sql = `SELECT * FROM ${T_SUMMARY} WHERE academic_year_term_id = $1 AND campus_id = $2`;
  const params: Array<number | string> = [academicYearTermId, campusId];
  if (cc) {
    sql += ` AND UPPER(TRIM(college_code)) = $3`;
    params.push(cc);
  }
  sql += ` ORDER BY student_no ASC`;
  const { rows } = await pool.query(sql, params);
  return rows.map((row) => mapSummary(row as Record<string, unknown>));
}

export type RecalculatePayload = {
  ids?: number[];
  allInFilter?: { academicYearTermId: number; campusId: number; collegeCode: string };
  recomputeAllTerms?: boolean;
  gradeLevel?: string;
  formatKey?: string;
};

export async function recalculateStudentGradeSummaries(payload: RecalculatePayload): Promise<{
  processed: number;
}> {
  await ensureTable();
  const gl = payload.gradeLevel?.trim() || "College";
  const fk = payload.formatKey?.trim() || "format_1";

  let targetIds: number[] = [];
  if (payload.ids?.length) {
    targetIds = payload.ids.filter((n) => Number.isFinite(n) && n > 0);
  } else if (payload.allInFilter) {
    const rows = await listStudentGradeSummaries(
      payload.allInFilter.academicYearTermId,
      payload.allInFilter.campusId,
      payload.allInFilter.collegeCode ?? ""
    );
    targetIds = rows.map((r) => r.id);
  }

  if (!targetIds.length) return { processed: 0 };

  const expanded = new Set<number>();
  if (payload.recomputeAllTerms) {
    for (const id of targetIds) {
      const { rows } = await pool.query(`SELECT student_no FROM ${T_SUMMARY} WHERE id = $1`, [id]);
      if (!rows.length) continue;
      const sn = String(rows[0].student_no);
      const { rows: allRows } = await pool.query(`SELECT id FROM ${T_SUMMARY} WHERE student_no = $1`, [sn]);
      for (const r of allRows) expanded.add(Number(r.id));
    }
  } else {
    targetIds.forEach((id) => expanded.add(id));
  }

  let processed = 0;
  for (const id of expanded) {
    await recomputeOneSummaryRow(id, gl, fk);
    processed += 1;
  }
  return { processed };
}
