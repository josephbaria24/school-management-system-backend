import pool from "../db.js";
import { searchReportStudents, type ReportStudentPick } from "./reportOfGrades.service.js";

const T_SUMMARY = "student_grade_summary";
const T_CORR_LINE = "correction_of_grades_line";

export const GPA_REPORT_TITLES = [
  { key: "gwa_layout_1", label: "Grade Point/Weighted Average List [Layout 1]" },
  { key: "gwa_layout_2", label: "Grade Point/Weighted Average List [Layout 2]" },
  { key: "gwa_by_year_level", label: "Grade Point/Weighted Average List by Year Level" },
  { key: "cumulative_gwa", label: "Cumulative Grade Point Average List" },
  { key: "honor_graduating", label: "Academic Honor Students List [Graduating]" },
  { key: "honor_undergrad", label: "Academic Honor Students List [Under Graduate]" },
  { key: "correction_list_1", label: "List of Students with correction of grades 1" },
  { key: "correction_list_2", label: "List of Students with correction of grades 2" },
  { key: "correction_stats", label: "List of Students with correction of grades Statistics" },
] as const;

export const GPA_SORT_OPTIONS = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Last name, first name" },
  { key: "student_no", label: "Student number" },
  { key: "year_level", label: "Year level" },
] as const;

export type GwaListingRow = {
  rank: number;
  student_no: string;
  student_name: string | null;
  reg_id: string | null;
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

export type CorrectionListingRow = {
  student_no: string;
  student_name: string | null;
  subject_code: string | null;
  subject_title: string | null;
  class_section: string | null;
  midterm: string | null;
  final: string | null;
  re_exam: string | null;
  remarks: string | null;
  credit_units: string | null;
};

export type CorrectionStatsRow = {
  label: string;
  count: number;
};

export type GpaPreviewPayload = {
  report_key: string;
  report_label: string;
  term_label: string;
  campus_name: string;
  gwa_rows: GwaListingRow[];
  correction_rows: CorrectionListingRow[];
  correction_stats: CorrectionStatsRow[];
  grouped_by_year_level: { year_level: string; rows: GwaListingRow[] }[];
};

export { searchReportStudents, type ReportStudentPick };

export function getGpaRankingOptions() {
  return {
    report_titles: GPA_REPORT_TITLES.map((r) => ({ key: r.key, label: r.label })),
    sort_options: GPA_SORT_OPTIONS.map((s) => ({ key: s.key, label: s.label })),
    year_levels: [
      { key: "", label: "[All year level]" },
      { key: "1", label: "1st Year" },
      { key: "2", label: "2nd Year" },
      { key: "3", label: "3rd Year" },
      { key: "4", label: "4th Year" },
      { key: "5", label: "5th Year" },
      { key: "GRAD", label: "Graduate" },
    ],
    condition_fields: [
      { key: "", label: "—" },
      { key: "gwa_lte", label: "GWA less than or equal" },
      { key: "gwa_gte", label: "GWA greater than or equal" },
      { key: "qualified", label: "Qualified only (Y)" },
    ],
  };
}

function mapSummaryRow(r: Record<string, unknown>): GwaListingRow {
  return {
    rank: 0,
    student_no: String(r.student_no),
    student_name: r.student_name == null ? null : String(r.student_name),
    reg_id: r.reg_id == null ? null : String(r.reg_id),
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

function applyCondition(rows: GwaListingRow[], field: string, value: string): GwaListingRow[] {
  const f = field.trim().toLowerCase();
  if (!f) return rows;
  if (f === "qualified") {
    return rows.filter((r) => (r.qualified ?? "").toUpperCase() === "Y");
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return rows;
  if (f === "gwa_lte") {
    return rows.filter((r) => {
      const g = r.gwa == null ? NaN : Number(r.gwa);
      return Number.isFinite(g) && g <= num;
    });
  }
  if (f === "gwa_gte") {
    return rows.filter((r) => {
      const g = r.gwa == null ? NaN : Number(r.gwa);
      return Number.isFinite(g) && g >= num;
    });
  }
  return rows;
}

function sortGwaRows(rows: GwaListingRow[], sortBy: string): GwaListingRow[] {
  const key = sortBy.trim().toLowerCase();
  const copy = [...rows];
  if (key === "rank") {
    copy.sort((a, b) => {
      const ga = a.gwa == null || a.gwa === "" ? 9999 : Number(a.gwa);
      const gb = b.gwa == null || b.gwa === "" ? 9999 : Number(b.gwa);
      if (ga !== gb) return ga - gb;
      return (a.student_name ?? a.student_no).localeCompare(b.student_name ?? b.student_no);
    });
  } else if (key === "student_no") {
    copy.sort((a, b) => a.student_no.localeCompare(b.student_no, undefined, { numeric: true }));
  } else if (key === "year_level") {
    copy.sort((a, b) => (a.year_level ?? "").localeCompare(b.year_level ?? "", undefined, { numeric: true }));
  } else {
    copy.sort((a, b) =>
      (a.student_name ?? a.student_no).localeCompare(b.student_name ?? b.student_no, undefined, {
        sensitivity: "base",
      })
    );
  }
  copy.forEach((r, i) => {
    r.rank = i + 1;
  });
  return copy;
}

export async function resolveGpaStudents(params: {
  academicYearTermId: number;
  campusId: number;
  studentNos?: string[];
  allGroups?: boolean;
  collegeCode?: string;
  program?: string;
  majorStudy?: string;
  yearLevel?: string;
  sortBy?: string;
}): Promise<ReportStudentPick[]> {
  const nos = (params.studentNos ?? []).map((s) => s.trim()).filter(Boolean);
  if (nos.length) {
    const out: ReportStudentPick[] = [];
    for (const sn of nos) {
      const { rows } = await pool.query(
        `
        SELECT student_no, student_name, college, program, year_level
        FROM ${T_SUMMARY}
        WHERE academic_year_term_id = $1 AND campus_id = $2 AND UPPER(TRIM(student_no)) = UPPER(TRIM($3))
        LIMIT 1
      `,
        [params.academicYearTermId, params.campusId, sn]
      );
      if (rows.length) {
        const r = rows[0] as Record<string, unknown>;
        out.push({
          student_no: sn,
          student_name: r.student_name == null ? null : String(r.student_name),
          college: r.college == null ? null : String(r.college),
          program: r.program == null ? null : String(r.program),
          year_level: r.year_level == null ? null : String(r.year_level),
        });
      } else {
        out.push({ student_no: sn, student_name: null, college: null, program: null, year_level: null });
      }
    }
    return out;
  }

  let sql = `SELECT DISTINCT student_no, student_name, college, program, year_level FROM ${T_SUMMARY} WHERE academic_year_term_id = $1 AND campus_id = $2`;
  const qparams: Array<number | string> = [params.academicYearTermId, params.campusId];
  let idx = 3;

  if (!params.allGroups && params.collegeCode?.trim()) {
    sql += ` AND UPPER(TRIM(college_code)) = UPPER(TRIM($${idx}))`;
    qparams.push(params.collegeCode.trim());
    idx += 1;
  }

  const prog = params.program?.trim();
  if (!params.allGroups && prog) {
    sql += ` AND COALESCE(program, '') ILIKE $${idx}`;
    qparams.push(`%${prog}%`);
    idx += 1;
  }

  const major = params.majorStudy?.trim();
  if (!params.allGroups && major) {
    sql += ` AND COALESCE(program, '') ILIKE $${idx}`;
    qparams.push(`%${major}%`);
    idx += 1;
  }

  const yl = params.yearLevel?.trim();
  if (yl && !/^all/i.test(yl)) {
    sql += ` AND COALESCE(year_level, '') ILIKE $${idx}`;
    qparams.push(`%${yl}%`);
    idx += 1;
  }

  sql += ` ORDER BY student_no ASC`;
  const { rows } = await pool.query(sql, qparams);
  return rows.map((r) => ({
    student_no: String((r as Record<string, unknown>).student_no),
    student_name: (r as Record<string, unknown>).student_name == null ? null : String((r as Record<string, unknown>).student_name),
    college: (r as Record<string, unknown>).college == null ? null : String((r as Record<string, unknown>).college),
    program: (r as Record<string, unknown>).program == null ? null : String((r as Record<string, unknown>).program),
    year_level: (r as Record<string, unknown>).year_level == null ? null : String((r as Record<string, unknown>).year_level),
  }));
}

async function fetchSummaryRows(
  academicYearTermId: number,
  campusId: number,
  studentNos: string[]
): Promise<GwaListingRow[]> {
  if (!studentNos.length) return [];
  const { rows } = await pool.query(
    `
    SELECT *
    FROM ${T_SUMMARY}
    WHERE academic_year_term_id = $1 AND campus_id = $2
      AND UPPER(TRIM(student_no)) = ANY(
        SELECT UPPER(TRIM(x)) FROM UNNEST($3::text[]) AS x
      )
    ORDER BY student_no ASC
  `,
    [academicYearTermId, campusId, studentNos]
  );
  return rows.map((row) => mapSummaryRow(row as Record<string, unknown>));
}

async function fetchCumulativeRows(studentNos: string[]): Promise<GwaListingRow[]> {
  if (!studentNos.length) return [];
  const { rows } = await pool.query(
    `
    SELECT student_no,
           MAX(student_name) AS student_name,
           MAX(reg_id) AS reg_id,
           MAX(college) AS college,
           MAX(program) AS program,
           MAX(year_level) AS year_level,
           SUM(enrolled_courses)::int AS enrolled_courses,
           SUM(credit_units_enrolled) AS credit_units_enrolled,
           SUM(credit_units_earned) AS credit_units_earned,
           CASE WHEN SUM(credit_units_enrolled) > 0
             THEN ROUND(
               SUM(COALESCE(gwa, 0) * COALESCE(credit_units_enrolled, 0)) / NULLIF(SUM(credit_units_enrolled), 0),
               4
             )
             ELSE NULL
           END AS gwa,
           MAX(qualified) AS qualified,
           MAX(remarks) AS remarks,
           MAX(scholastic_delinquency) AS scholastic_delinquency
    FROM ${T_SUMMARY}
    WHERE UPPER(TRIM(student_no)) = ANY(
      SELECT UPPER(TRIM(x)) FROM UNNEST($1::text[]) AS x
    )
    GROUP BY student_no
    ORDER BY student_no ASC
  `,
    [studentNos]
  );
  return rows.map((row) => mapSummaryRow(row as Record<string, unknown>));
}

async function fetchCorrectionRows(
  academicYearTermId: number,
  studentNos: string[]
): Promise<CorrectionListingRow[]> {
  if (!studentNos.length) return [];
  try {
    const { rows } = await pool.query(
      `
      SELECT c.student_no, s.student_name, c.subject_code, c.subject_title, c.class_section,
             c.midterm, c.final, c.re_exam, c.remarks, c.credit_units
      FROM ${T_CORR_LINE} c
      LEFT JOIN (
        SELECT DISTINCT student_no, student_name
        FROM ${T_SUMMARY}
        WHERE academic_year_term_id = $1
      ) s ON UPPER(TRIM(s.student_no)) = UPPER(TRIM(c.student_no))
      WHERE c.academic_year_term_id = $1
        AND UPPER(TRIM(c.student_no)) = ANY(
          SELECT UPPER(TRIM(x)) FROM UNNEST($2::text[]) AS x
        )
      ORDER BY c.student_no ASC, c.sort_order ASC, c.id ASC
    `,
      [academicYearTermId, studentNos]
    );
    return rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        student_no: String(row.student_no),
        student_name: row.student_name == null ? null : String(row.student_name),
        subject_code: row.subject_code == null ? null : String(row.subject_code),
        subject_title: row.subject_title == null ? null : String(row.subject_title),
        class_section: row.class_section == null ? null : String(row.class_section),
        midterm: row.midterm == null ? null : String(row.midterm),
        final: row.final == null ? null : String(row.final),
        re_exam: row.re_exam == null ? null : String(row.re_exam),
        remarks: row.remarks == null ? null : String(row.remarks),
        credit_units: row.credit_units == null ? null : String(row.credit_units),
      };
    });
  } catch {
    return [];
  }
}

function buildCorrectionStats(rows: CorrectionListingRow[]): CorrectionStatsRow[] {
  const byStudent = new Set(rows.map((r) => r.student_no.toUpperCase()));
  const bySubject = new Set(rows.map((r) => `${r.student_no}|${r.subject_code ?? ""}`.toUpperCase()));
  return [
    { label: "Students with corrections", count: byStudent.size },
    { label: "Correction line items", count: rows.length },
    { label: "Unique student/subject pairs", count: bySubject.size },
  ];
}

function groupByYearLevel(rows: GwaListingRow[]): { year_level: string; rows: GwaListingRow[] }[] {
  const map = new Map<string, GwaListingRow[]>();
  for (const r of rows) {
    const key = (r.year_level ?? "").trim() || "—";
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([year_level, groupRows]) => ({
      year_level,
      rows: sortGwaRows(groupRows, "rank"),
    }));
}

export async function buildGpaRankingPreview(params: {
  academicYearTermId: number;
  campusId: number;
  reportKey: string;
  studentNos: string[];
  sortBy?: string;
  withCondition?: boolean;
  conditionField?: string;
  conditionValue?: string;
}): Promise<GpaPreviewPayload> {
  const reportKey = params.reportKey.trim() || "gwa_layout_1";
  const reportDef = GPA_REPORT_TITLES.find((r) => r.key === reportKey) ?? GPA_REPORT_TITLES[0];
  const sortBy = params.sortBy?.trim() || "rank";

  let termLabel = "";
  try {
    const { rows } = await pool.query(`SELECT academic_year, term FROM academic_year_terms WHERE id = $1`, [
      params.academicYearTermId,
    ]);
    if (rows.length) {
      const r = rows[0] as Record<string, unknown>;
      termLabel = `${r.academic_year ?? ""} ${r.term ?? ""}`.trim();
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

  const isCorrection =
    reportKey === "correction_list_1" || reportKey === "correction_list_2" || reportKey === "correction_stats";

  if (isCorrection) {
    const correction_rows = await fetchCorrectionRows(params.academicYearTermId, params.studentNos);
    return {
      report_key: reportKey,
      report_label: reportDef.label,
      term_label: termLabel,
      campus_name: campusName,
      gwa_rows: [],
      correction_rows,
      correction_stats: reportKey === "correction_stats" ? buildCorrectionStats(correction_rows) : [],
      grouped_by_year_level: [],
    };
  }

  let gwa_rows: GwaListingRow[];
  if (reportKey === "cumulative_gwa") {
    gwa_rows = await fetchCumulativeRows(params.studentNos);
  } else {
    gwa_rows = await fetchSummaryRows(params.academicYearTermId, params.campusId, params.studentNos);
  }

  if (reportKey === "honor_graduating") {
    gwa_rows = gwa_rows.filter(
      (r) =>
        (r.qualified ?? "").toUpperCase() === "Y" &&
        /grad/i.test(r.year_level ?? "")
    );
  } else if (reportKey === "honor_undergrad") {
    gwa_rows = gwa_rows.filter(
      (r) => (r.qualified ?? "").toUpperCase() === "Y" && !/grad/i.test(r.year_level ?? "")
    );
  }

  if (params.withCondition) {
    gwa_rows = applyCondition(gwa_rows, params.conditionField ?? "", params.conditionValue ?? "");
  }

  gwa_rows = sortGwaRows(gwa_rows, sortBy);

  const grouped_by_year_level =
    reportKey === "gwa_by_year_level" ? groupByYearLevel(gwa_rows) : [];

  return {
    report_key: reportKey,
    report_label: reportDef.label,
    term_label: termLabel,
    campus_name: campusName,
    gwa_rows,
    correction_rows: [],
    correction_stats: [],
    grouped_by_year_level,
  };
}
