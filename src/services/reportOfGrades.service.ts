import pool from "../db.js";
import { lookupEnrollmentSnapshot } from "./correctionOfGrades.service.js";

const T_GRADES = "grade_encoding_line";
const T_SUMMARY = "student_grade_summary";
const T_SETTINGS = "grade_encoding_student_settings";

export const REPORT_LAYOUTS = [
  { key: "final_grade", label: "Final grade" },
  { key: "midterm", label: "Midterm" },
  { key: "full", label: "Midterm and final" },
] as const;

export const REPORT_SORT_OPTIONS = [
  { key: "name", label: "Last name, first name" },
  { key: "student_no", label: "Student number" },
  { key: "year_level", label: "Year level" },
] as const;

export type ReportStudentPick = {
  student_no: string;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
};

export type ReportGradeRow = {
  academic_year_term_label: string;
  course_code: string | null;
  course_title: string | null;
  class_section: string | null;
  lec_units: string | null;
  lab_units: string | null;
  unit: string | null;
  midterm: string | null;
  final: string | null;
  re_exam: string | null;
  credited_units: string | null;
  remark: string | null;
};

export type StudentReport = {
  student_no: string;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
  campus: string | null;
  registration_no: string | null;
  lines: ReportGradeRow[];
};

function termLabel(academicYear: string, term: string): string {
  return `${academicYear} ${term}`.trim();
}

function isSummerTerm(term: string, flag: boolean): boolean {
  if (flag) return true;
  return /summer/i.test(term);
}

async function getIncludeSummer(studentNo: string): Promise<boolean> {
  try {
    const { rows } = await pool.query(`SELECT include_summer FROM ${T_SETTINGS} WHERE student_no = $1`, [
      studentNo.trim(),
    ]);
    return Boolean(rows[0]?.include_summer);
  } catch {
    return false;
  }
}

function sortStudents(rows: ReportStudentPick[], sortBy: string): ReportStudentPick[] {
  const key = sortBy.trim().toLowerCase();
  const copy = [...rows];
  copy.sort((a, b) => {
    if (key === "student_no") {
      return a.student_no.localeCompare(b.student_no, undefined, { numeric: true });
    }
    if (key === "year_level") {
      return (a.year_level ?? "").localeCompare(b.year_level ?? "", undefined, { numeric: true });
    }
    const an = (a.student_name ?? a.student_no).toLowerCase();
    const bn = (b.student_name ?? b.student_no).toLowerCase();
    return an.localeCompare(bn);
  });
  return copy;
}

export async function searchReportStudents(params: {
  academicYearTermId: number;
  campusId: number;
  q: string;
  limit?: number;
}): Promise<ReportStudentPick[]> {
  const q = params.q.trim();
  if (!q) return [];
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  const like = `%${q}%`;

  const found = new Map<string, ReportStudentPick>();

  try {
    const { rows } = await pool.query(
      `
      SELECT DISTINCT student_no, student_name, college, program, year_level
      FROM ${T_SUMMARY}
      WHERE academic_year_term_id = $1 AND campus_id = $2
        AND (
          student_no ILIKE $3
          OR COALESCE(student_name, '') ILIKE $3
          OR COALESCE(reg_id, '') ILIKE $3
        )
      ORDER BY student_name NULLS LAST, student_no ASC
      LIMIT $4
    `,
      [params.academicYearTermId, params.campusId, like, limit]
    );
    for (const r of rows) {
      const sn = String(r.student_no).trim();
      if (!sn) continue;
      found.set(sn.toUpperCase(), {
        student_no: sn,
        student_name: r.student_name == null ? null : String(r.student_name),
        college: r.college == null ? null : String(r.college),
        program: r.program == null ? null : String(r.program),
        year_level: r.year_level == null ? null : String(r.year_level),
      });
    }
  } catch {
    /* table may not exist */
  }

  if (found.size < limit) {
    try {
      const { rows } = await pool.query(
        `
        SELECT DISTINCT g.student_no
        FROM ${T_GRADES} g
        WHERE g.student_no ILIKE $1
        ORDER BY g.student_no ASC
        LIMIT $2
      `,
        [like, limit]
      );
      for (const r of rows) {
        const sn = String(r.student_no).trim();
        if (!sn || found.has(sn.toUpperCase())) continue;
        const snap = await lookupEnrollmentSnapshot(params.academicYearTermId, sn);
        found.set(sn.toUpperCase(), {
          student_no: sn,
          student_name: snap?.student_name ?? null,
          college: snap?.college ?? null,
          program: snap?.program ?? null,
          year_level: snap?.year_level ?? null,
        });
        if (found.size >= limit) break;
      }
    } catch {
      /* noop */
    }
  }

  return [...found.values()];
}

export async function resolveReportStudents(params: {
  academicYearTermId: number;
  campusId: number;
  studentNos?: string[];
  collegeCode?: string;
  program?: string;
  yearLevel?: string;
  sortBy?: string;
}): Promise<ReportStudentPick[]> {
  const sortBy = params.sortBy ?? "name";
  const nos = (params.studentNos ?? []).map((s) => s.trim()).filter(Boolean);
  if (nos.length) {
    const out: ReportStudentPick[] = [];
    for (const sn of nos) {
      let row: ReportStudentPick = {
        student_no: sn,
        student_name: null,
        college: null,
        program: null,
        year_level: null,
      };
      try {
        const { rows } = await pool.query(
          `
          SELECT student_name, college, program, year_level
          FROM ${T_SUMMARY}
          WHERE academic_year_term_id = $1 AND campus_id = $2 AND UPPER(TRIM(student_no)) = UPPER(TRIM($3))
          LIMIT 1
        `,
          [params.academicYearTermId, params.campusId, sn]
        );
        if (rows.length) {
          const r = rows[0] as Record<string, unknown>;
          row = {
            student_no: sn,
            student_name: r.student_name == null ? null : String(r.student_name),
            college: r.college == null ? null : String(r.college),
            program: r.program == null ? null : String(r.program),
            year_level: r.year_level == null ? null : String(r.year_level),
          };
        }
      } catch {
        /* noop */
      }
      if (!row.student_name) {
        const snap = await lookupEnrollmentSnapshot(params.academicYearTermId, sn);
        if (snap) {
          row = {
            student_no: sn,
            student_name: snap.student_name,
            college: snap.college,
            program: snap.program,
            year_level: snap.year_level,
          };
        }
      }
      out.push(row);
    }
    return sortStudents(out, sortBy);
  }

  let sql = `
    SELECT DISTINCT student_no, student_name, college, program, year_level
    FROM ${T_SUMMARY}
    WHERE academic_year_term_id = $1 AND campus_id = $2
  `;
  const qparams: Array<number | string> = [params.academicYearTermId, params.campusId];
  let idx = 3;

  const cc = (params.collegeCode ?? "").trim();
  if (cc) {
    sql += ` AND UPPER(TRIM(college_code)) = UPPER(TRIM($${idx}))`;
    qparams.push(cc);
    idx += 1;
  }

  const prog = (params.program ?? "").trim();
  if (prog) {
    sql += ` AND COALESCE(program, '') ILIKE $${idx}`;
    qparams.push(`%${prog}%`);
    idx += 1;
  }

  const yl = (params.yearLevel ?? "").trim();
  if (yl && !/^all/i.test(yl)) {
    sql += ` AND COALESCE(year_level, '') ILIKE $${idx}`;
    qparams.push(`%${yl}%`);
    idx += 1;
  }

  sql += ` ORDER BY student_no ASC`;

  try {
    const { rows } = await pool.query(sql, qparams);
    const mapped = rows.map((r) => ({
      student_no: String(r.student_no),
      student_name: r.student_name == null ? null : String(r.student_name),
      college: r.college == null ? null : String(r.college),
      program: r.program == null ? null : String(r.program),
      year_level: r.year_level == null ? null : String(r.year_level),
    }));
    return sortStudents(mapped, sortBy);
  } catch {
    return [];
  }
}

async function listGradeLinesForStudent(
  studentNo: string,
  includeSummer: boolean,
  academicYearTermId?: number
): Promise<ReportGradeRow[]> {
  const sn = studentNo.trim();
  const { rows } = await pool.query(
    `
    SELECT g.*, t.academic_year, t.term
    FROM ${T_GRADES} g
    LEFT JOIN academic_year_terms t ON t.id = g.academic_year_term_id
    WHERE g.student_no = $1
    ORDER BY t.academic_year DESC, t.term DESC, g.sort_order ASC, g.id ASC
  `,
    [sn]
  );

  return rows
    .map((row) => {
      const ay = row.academic_year == null ? "" : String(row.academic_year);
      const tm = row.term == null ? "" : String(row.term);
      const label = termLabel(ay, tm);
      const termId = Number(row.academic_year_term_id);
      if (academicYearTermId != null && termId !== academicYearTermId) {
        return null;
      }
      if (!includeSummer && isSummerTerm(label, Boolean(row.is_summer_term))) {
        return null;
      }
      return {
        academic_year_term_label: label,
        course_code: row.course_code == null ? null : String(row.course_code),
        course_title: row.course_title == null ? null : String(row.course_title),
        class_section: row.class_section == null ? null : String(row.class_section),
        lec_units: row.lec_units == null ? (row.unit == null ? null : String(row.unit)) : String(row.lec_units),
        lab_units: row.lab_units == null ? null : String(row.lab_units),
        unit: row.unit == null ? null : String(row.unit),
        midterm: row.midterm == null ? null : String(row.midterm),
        final: row.final == null ? null : String(row.final),
        re_exam: row.re_exam == null ? null : String(row.re_exam),
        credited_units: row.credited_units == null ? null : String(row.credited_units),
        remark: row.remark == null ? null : String(row.remark),
      };
    })
    .filter((r): r is ReportGradeRow => r != null);
}

export async function buildReportPreview(params: {
  academicYearTermId: number;
  campusId: number;
  layout: string;
  studentNos: string[];
  includeSummer?: boolean;
  termScope?: "all" | "selected";
}): Promise<{
  layout: string;
  layout_label: string;
  term_label: string;
  campus_name: string;
  reports: StudentReport[];
}> {
  const layout = params.layout.trim() || "final_grade";
  const layoutDef = REPORT_LAYOUTS.find((l) => l.key === layout) ?? REPORT_LAYOUTS[0];
  const termScope = params.termScope ?? "all";

  let termLabelOut = "";
  try {
    const { rows } = await pool.query(`SELECT academic_year, term FROM academic_year_terms WHERE id = $1`, [
      params.academicYearTermId,
    ]);
    if (rows.length) {
      termLabelOut = termLabel(String(rows[0].academic_year ?? ""), String(rows[0].term ?? ""));
    }
  } catch {
    /* noop */
  }

  let campusName = "";
  try {
    const { rows } = await pool.query(`SELECT acronym, campus_name FROM campuses WHERE id = $1`, [params.campusId]);
    if (rows.length) {
      const r = rows[0] as Record<string, unknown>;
      campusName = [r.acronym, r.campus_name].filter(Boolean).join(" — ").trim() || String(r.campus_name ?? "");
    }
  } catch {
    /* noop */
  }

  const reports: StudentReport[] = [];
  for (const sn of params.studentNos) {
    const includeSummer = params.includeSummer ?? (await getIncludeSummer(sn));
    const snap = await lookupEnrollmentSnapshot(params.academicYearTermId, sn);
    const lines = await listGradeLinesForStudent(
      sn,
      includeSummer,
      termScope === "selected" ? params.academicYearTermId : undefined
    );
    reports.push({
      student_no: sn,
      student_name: snap?.student_name ?? null,
      college: snap?.college ?? null,
      program: snap?.program ?? null,
      year_level: snap?.year_level ?? null,
      campus: snap?.campus ?? (campusName || null),
      registration_no: snap?.registration_no ?? null,
      lines,
    });
  }

  return {
    layout,
    layout_label: layoutDef.label,
    term_label: termLabelOut,
    campus_name: campusName,
    reports,
  };
}

export function getReportOptions() {
  return {
    layouts: REPORT_LAYOUTS.map((l) => ({ key: l.key, label: l.label })),
    sort_options: REPORT_SORT_OPTIONS.map((s) => ({ key: s.key, label: s.label })),
    year_levels: [
      { key: "", label: "[All years]" },
      { key: "1", label: "1st Year" },
      { key: "2", label: "2nd Year" },
      { key: "3", label: "3rd Year" },
      { key: "4", label: "4th Year" },
      { key: "5", label: "5th Year" },
      { key: "GRAD", label: "Graduate" },
    ],
  };
}
