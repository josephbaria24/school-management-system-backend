import pool from "../db.js";

const T_SUMMARY = "student_grade_summary";
const T_GRADES = "grade_encoding_line";
const T_WITHDRAWN = "add_drop_withdrawn_list";

export const REPORT_CATEGORIES = [
  { key: "grade_school", label: "Grade School", color: "sky" },
  { key: "high_school", label: "High School", color: "amber" },
  { key: "undergraduate", label: "Undergraduate Programs", color: "emerald" },
  { key: "graduate_school", label: "Graduate School", color: "rose" },
] as const;

const BASE_REPORTS = [
  { key: "official_enrollment_list", label: "Official List of Enrollment" },
  { key: "enrollment_by_gender", label: "Enrollment Statistics by Gender" },
  { key: "enrollment_by_year_level", label: "Enrollment Statistics by Year Level" },
  { key: "enrollment_list", label: "Enrollment List" },
  { key: "summary_enrolled_subjects", label: "Summary of Enrolled Subjects" },
  { key: "summary_enrollment", label: "Summary of Enrollment" },
  { key: "academic_load_statistics", label: "Students' Academic Load Statistics" },
  { key: "special_class_list", label: "List of Students With Special Class" },
  { key: "withdrawal_students", label: "List of Withdrawal Students" },
  { key: "unofficial_enrollment", label: "Unofficially Enrolled Students" },
  { key: "students_master_list", label: "Students Master List" },
  { key: "students_directory", label: "Students Directory" },
  { key: "distribution_enrollment", label: "Distribution of Enrollment Data" },
] as const;

export type ReportTableSection = {
  heading: string;
  columns: string[];
  rows: string[][];
};

export type ListOfReportsPreview = {
  category: string;
  category_label: string;
  report_key: string;
  report_label: string;
  term_label: string;
  campus_name: string;
  filter_summary: string;
  sections: ReportTableSection[];
};

type StudentRow = {
  student_no: string;
  student_name: string | null;
  college: string | null;
  college_code: string | null;
  program: string | null;
  year_level: string | null;
  gwa: string | null;
};

function isMasteralProgram(program: string | null): boolean {
  const p = (program ?? "").toLowerCase();
  return /master|ma\b|ms\b|mba|mph|edd|phd|graduate/.test(p);
}

function matchesCategory(program: string | null, yearLevel: string | null, category: string): boolean {
  const p = `${program ?? ""} ${yearLevel ?? ""}`.toLowerCase();
  if (category === "grade_school") {
    return /grade school|elementary|primary|\bgs\b|grade [1-6]/.test(p);
  }
  if (category === "high_school") {
    return /high school|junior high|senior high|\bhs\b|grade (7|8|9|10|11|12)/.test(p);
  }
  if (category === "graduate_school") {
    return isMasteralProgram(program);
  }
  if (category === "undergraduate") {
    if (isMasteralProgram(program)) return false;
    if (/grade school|elementary|high school|junior high|senior high|\bhs\b/.test(p)) return false;
    return true;
  }
  return true;
}

function sortStudents(rows: StudentRow[], sortBy: string): StudentRow[] {
  const key = sortBy.trim().toLowerCase();
  const copy = [...rows];
  if (key === "student_no") {
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
  return copy;
}

function cell(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

export function getListOfReportsOptions() {
  return {
    categories: REPORT_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      color: c.color,
      reports: BASE_REPORTS.map((r) => ({ key: r.key, label: r.label })),
    })),
    sort_options: [
      { key: "name", label: "Last name, first name" },
      { key: "student_no", label: "Student number" },
      { key: "year_level", label: "Year level" },
    ],
    year_levels: [
      { key: "", label: "[All year level]" },
      { key: "1", label: "1st Year" },
      { key: "2", label: "2nd Year" },
      { key: "3", label: "3rd Year" },
      { key: "4", label: "4th Year" },
      { key: "5", label: "5th Year" },
      { key: "GRAD", label: "Graduate" },
    ],
  };
}

async function loadStudents(params: {
  academicYearTermId: number;
  campusId: number;
  category: string;
  collegeCode?: string;
  program?: string;
  majorStudy?: string;
  yearLevel?: string;
  sortBy?: string;
}): Promise<StudentRow[]> {
  let sql = `
    SELECT student_no, student_name, college, college_code, program, year_level, gwa::text AS gwa
    FROM ${T_SUMMARY}
    WHERE academic_year_term_id = $1 AND campus_id = $2
  `;
  const qparams: Array<number | string> = [params.academicYearTermId, params.campusId];
  let idx = 3;

  if (params.collegeCode?.trim()) {
    sql += ` AND UPPER(TRIM(college_code)) = UPPER(TRIM($${idx}))`;
    qparams.push(params.collegeCode.trim());
    idx += 1;
  }
  if (params.program?.trim()) {
    sql += ` AND COALESCE(program, '') ILIKE $${idx}`;
    qparams.push(`%${params.program.trim()}%`);
    idx += 1;
  }
  if (params.majorStudy?.trim()) {
    sql += ` AND COALESCE(program, '') ILIKE $${idx}`;
    qparams.push(`%${params.majorStudy.trim()}%`);
    idx += 1;
  }
  if (params.yearLevel?.trim() && !/^all/i.test(params.yearLevel)) {
    sql += ` AND COALESCE(year_level, '') ILIKE $${idx}`;
    qparams.push(`%${params.yearLevel.trim()}%`);
    idx += 1;
  }

  sql += ` ORDER BY student_no ASC`;

  try {
    const { rows } = await pool.query(sql, qparams);
    const mapped = rows
      .map((r) => {
        const row = r as Record<string, unknown>;
        return {
          student_no: String(row.student_no),
          student_name: row.student_name == null ? null : String(row.student_name),
          college: row.college == null ? null : String(row.college),
          college_code: row.college_code == null ? null : String(row.college_code),
          program: row.program == null ? null : String(row.program),
          year_level: row.year_level == null ? null : String(row.year_level),
          gwa: row.gwa == null ? null : String(row.gwa),
        };
      })
      .filter((s) => matchesCategory(s.program, s.year_level, params.category));
    return sortStudents(mapped, params.sortBy ?? "name");
  } catch {
    return [];
  }
}

export async function buildListOfReportsPreview(params: {
  academicYearTermId: number;
  campusId: number;
  category: string;
  reportKey: string;
  collegeCode?: string;
  program?: string;
  majorStudy?: string;
  yearLevel?: string;
  sortBy?: string;
}): Promise<ListOfReportsPreview> {
  const category = params.category.trim() || "graduate_school";
  const reportKey = params.reportKey.trim() || "official_enrollment_list";
  const catDef = REPORT_CATEGORIES.find((c) => c.key === category) ?? REPORT_CATEGORIES[3];
  const repDef = BASE_REPORTS.find((r) => r.key === reportKey) ?? BASE_REPORTS[0];

  let termLabel = "";
  const { rows: tRows } = await pool.query(`SELECT academic_year, term FROM academic_year_terms WHERE id = $1`, [
    params.academicYearTermId,
  ]);
  if (tRows.length) {
    const r = tRows[0] as Record<string, unknown>;
    termLabel = `${r.academic_year ?? ""} ${r.term ?? ""}`.trim();
  }

  let campusName = "";
  const { rows: cRows } = await pool.query(`SELECT acronym, campus_name FROM campuses WHERE id = $1`, [
    params.campusId,
  ]);
  if (cRows.length) {
    const r = cRows[0] as Record<string, unknown>;
    campusName = [r.acronym, r.campus_name].filter(Boolean).join(" — ").trim() || String(r.campus_name ?? "");
  }

  const filterBits = [
    params.collegeCode ? `College: ${params.collegeCode}` : null,
    params.program ? `Program: ${params.program}` : null,
    params.yearLevel ? `Year: ${params.yearLevel}` : null,
  ].filter(Boolean);

  const students = await loadStudents({
    academicYearTermId: params.academicYearTermId,
    campusId: params.campusId,
    category,
    collegeCode: params.collegeCode,
    program: params.program,
    majorStudy: params.majorStudy,
    yearLevel: params.yearLevel,
    sortBy: params.sortBy,
  });

  const sections: ReportTableSection[] = [];
  const studentCols = ["Student no.", "Name", "College", "Program", "Year level", "GWA"];

  const studentRows = () =>
    students.map((s) => [
      cell(s.student_no),
      cell(s.student_name),
      cell(s.college),
      cell(s.program),
      cell(s.year_level),
      cell(s.gwa),
    ]);

  if (
    reportKey === "official_enrollment_list" ||
    reportKey === "enrollment_list" ||
    reportKey === "students_master_list" ||
    reportKey === "students_directory"
  ) {
    sections.push({
      heading: repDef.label,
      columns: studentCols,
      rows: studentRows(),
    });
  } else if (reportKey === "enrollment_by_gender") {
    sections.push({
      heading: repDef.label,
      columns: ["Gender", "Headcount"],
      rows: [["Not tracked in summary", String(students.length)]],
    });
  } else if (reportKey === "enrollment_by_year_level") {
    const map = new Map<string, number>();
    for (const s of students) {
      const yl = cell(s.year_level) || "—";
      map.set(yl, (map.get(yl) ?? 0) + 1);
    }
    sections.push({
      heading: repDef.label,
      columns: ["Year level", "Headcount"],
      rows: [...map.entries()].map(([k, v]) => [k, String(v)]),
    });
  } else if (reportKey === "summary_enrollment") {
    const map = new Map<string, number>();
    for (const s of students) {
      const key = `${cell(s.college_code) || cell(s.college)} | ${cell(s.program)}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    sections.push({
      heading: repDef.label,
      columns: ["College / program", "Headcount"],
      rows: [...map.entries()].map(([k, v]) => [k, String(v)]),
    });
    sections.push({
      heading: "Total",
      columns: ["Description", "Count"],
      rows: [["Total students", String(students.length)]],
    });
  } else if (reportKey === "summary_enrolled_subjects") {
    const subjectMap = new Map<string, number>();
    try {
      const { rows } = await pool.query(
        `
        SELECT COALESCE(course_code, '') AS code, COALESCE(course_title, '') AS title, COUNT(DISTINCT student_no)::int AS cnt
        FROM ${T_GRADES}
        WHERE academic_year_term_id = $1
        GROUP BY course_code, course_title
        ORDER BY course_code ASC
      `,
        [params.academicYearTermId]
      );
      for (const r of rows) {
        const row = r as Record<string, unknown>;
        const label = `${cell(row.code)} ${cell(row.title)}`.trim();
        subjectMap.set(label, Number(row.cnt ?? 0));
      }
    } catch {
      /* noop */
    }
    sections.push({
      heading: repDef.label,
      columns: ["Subject", "Enrolled count"],
      rows: [...subjectMap.entries()].map(([k, v]) => [k, String(v)]),
    });
  } else if (reportKey === "academic_load_statistics") {
    const loads: string[][] = [];
    for (const s of students) {
      let units = "0";
      try {
        const { rows } = await pool.query(
          `SELECT COALESCE(SUM(unit), 0)::text AS u FROM ${T_GRADES} WHERE academic_year_term_id = $1 AND student_no = $2`,
          [params.academicYearTermId, s.student_no]
        );
        if (rows.length) units = String((rows[0] as Record<string, unknown>).u ?? "0");
      } catch {
        /* noop */
      }
      loads.push([cell(s.student_no), cell(s.student_name), units, cell(s.year_level)]);
    }
    sections.push({
      heading: repDef.label,
      columns: ["Student no.", "Name", "Total units", "Year level"],
      rows: loads,
    });
  } else if (reportKey === "withdrawal_students") {
    const wdRows: string[][] = [];
    try {
      const { rows } = await pool.query(
        `
        SELECT student_no, full_name, withdrawn_by, trans_date::text AS trans_date
        FROM ${T_WITHDRAWN}
        WHERE academic_year_term_id = $1
        ORDER BY full_name NULLS LAST, student_no ASC
      `,
        [params.academicYearTermId]
      );
      for (const r of rows) {
        const row = r as Record<string, unknown>;
        wdRows.push([
          cell(row.student_no),
          cell(row.full_name),
          cell(row.withdrawn_by),
          cell(row.trans_date),
        ]);
      }
    } catch {
      /* table may not exist */
    }
    sections.push({
      heading: repDef.label,
      columns: ["Student no.", "Name", "Withdrawn by", "Date"],
      rows: wdRows,
    });
  } else if (reportKey === "special_class_list" || reportKey === "unofficial_enrollment") {
    sections.push({
      heading: repDef.label,
      columns: ["Note"],
      rows: [[`No ${reportKey === "special_class_list" ? "special class" : "unofficial enrollment"} flag in current data model.`]],
    });
  } else if (reportKey === "distribution_enrollment") {
    const byCollege = new Map<string, number>();
    for (const s of students) {
      const c = cell(s.college_code) || cell(s.college) || "—";
      byCollege.set(c, (byCollege.get(c) ?? 0) + 1);
    }
    sections.push({
      heading: "By college",
      columns: ["College", "Headcount"],
      rows: [...byCollege.entries()].map(([k, v]) => [k, String(v)]),
    });
    const byYear = new Map<string, number>();
    for (const s of students) {
      const y = cell(s.year_level) || "—";
      byYear.set(y, (byYear.get(y) ?? 0) + 1);
    }
    sections.push({
      heading: "By year level",
      columns: ["Year level", "Headcount"],
      rows: [...byYear.entries()].map(([k, v]) => [k, String(v)]),
    });
  } else {
    sections.push({ heading: repDef.label, columns: studentCols, rows: studentRows() });
  }

  return {
    category,
    category_label: catDef.label,
    report_key: reportKey,
    report_label: repDef.label,
    term_label: termLabel,
    campus_name: campusName,
    filter_summary: filterBits.join(" · ") || "All groups",
    sections,
  };
}
