import pool from "../db.js";

const T_SUMMARY = "student_grade_summary";

export const CHED_LEVELS = [
  { key: "college", label: "College" },
  { key: "masteral", label: "Masteral" },
] as const;

export const CHED_COLLEGE_REPORTS = [
  { key: "institution_profile", label: "Institution profile" },
  { key: "summary_of_enrollment", label: "Summary of enrollment" },
  { key: "enrollment_list", label: "Enrollment list" },
  { key: "ched_form_xix", label: "CHED form XIX" },
  { key: "inventory_academic_programs", label: "Inventory of academic programs per campus" },
  { key: "inventory_enrolled_students", label: "Inventory of officially enrolled students per campus" },
  { key: "list_foreign_students", label: "List of foreign students" },
  { key: "total_campus_programs", label: "Total campus offered academic programs" },
] as const;

export const CHED_MASTERAL_REPORTS = [
  { key: "enrollment_list", label: "Enrollment List" },
  { key: "ched_form_xix", label: "CHED Form XIX" },
] as const;

export type ChedTableSection = {
  heading: string;
  columns: string[];
  rows: string[][];
};

export type ChedReportPreview = {
  report_key: string;
  report_label: string;
  level: string;
  level_label: string;
  term_label: string;
  campus_name: string;
  sections: ChedTableSection[];
};

export function getChedReportOptions() {
  return {
    levels: CHED_LEVELS.map((l) => ({ key: l.key, label: l.label })),
    college_reports: CHED_COLLEGE_REPORTS.map((r) => ({ key: r.key, label: r.label })),
    masteral_reports: CHED_MASTERAL_REPORTS.map((r) => ({ key: r.key, label: r.label })),
  };
}

function isMasteralProgram(program: string | null): boolean {
  const p = (program ?? "").toLowerCase();
  return /master|ma\b|ms\b|mba|mph|edd|phd|graduate/.test(p);
}

async function meta(termId: number, campusId: number) {
  let termLabel = "";
  const { rows: tRows } = await pool.query(`SELECT academic_year, term FROM academic_year_terms WHERE id = $1`, [
    termId,
  ]);
  if (tRows.length) {
    const r = tRows[0] as Record<string, unknown>;
    termLabel = `${r.academic_year ?? ""} ${r.term ?? ""}`.trim();
  }

  let campusName = "";
  const { rows: cRows } = await pool.query(`SELECT acronym, campus_name FROM campuses WHERE id = $1`, [campusId]);
  if (cRows.length) {
    const r = cRows[0] as Record<string, unknown>;
    campusName = [r.acronym, r.campus_name].filter(Boolean).join(" — ").trim() || String(r.campus_name ?? "");
  }

  return { termLabel, campusName };
}

async function loadEnrolledStudents(
  termId: number,
  campusId: number,
  level: string
): Promise<Array<Record<string, unknown>>> {
  try {
    const { rows } = await pool.query(
      `
      SELECT student_no, student_name, college, program, year_level, college_code, gwa, qualified
      FROM ${T_SUMMARY}
      WHERE academic_year_term_id = $1 AND campus_id = $2
      ORDER BY college_code NULLS LAST, program NULLS LAST, student_name NULLS LAST, student_no ASC
    `,
      [termId, campusId]
    );
    return rows.filter((r) => {
      const prog = String((r as Record<string, unknown>).program ?? "");
      const masteral = isMasteralProgram(prog);
      return level === "masteral" ? masteral : !masteral;
    }) as Array<Record<string, unknown>>;
  } catch {
    return [];
  }
}

function cell(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

export async function buildChedReportPreview(params: {
  academicYearTermId: number;
  campusId: number;
  level: string;
  reportKey: string;
}): Promise<ChedReportPreview> {
  const level = params.level.trim() === "masteral" ? "masteral" : "college";
  const reportKey = params.reportKey.trim() || "institution_profile";
  const levelDef = CHED_LEVELS.find((l) => l.key === level) ?? CHED_LEVELS[0];
  const reportList = level === "masteral" ? CHED_MASTERAL_REPORTS : CHED_COLLEGE_REPORTS;
  const reportDef = reportList.find((r) => r.key === reportKey) ?? reportList[0];

  const { termLabel, campusName } = await meta(params.academicYearTermId, params.campusId);
  const students = await loadEnrolledStudents(params.academicYearTermId, params.campusId, level);

  const sections: ChedTableSection[] = [];

  if (reportKey === "institution_profile") {
    let collegeCount = 0;
    let programCount = 0;
    try {
      const { rows: colRows } = await pool.query(
        `SELECT COUNT(*)::int AS c FROM colleges WHERE campus_id = $1 OR campus_id IS NULL`,
        [params.campusId]
      );
      collegeCount = Number((colRows[0] as Record<string, unknown>)?.c ?? 0);
      const { rows: progRows } = await pool.query(`SELECT COUNT(*)::int AS c FROM academic_programs`);
      programCount = Number((progRows[0] as Record<string, unknown>)?.c ?? 0);
    } catch {
      /* noop */
    }
    sections.push({
      heading: "Institution profile",
      columns: ["Field", "Value"],
      rows: [
        ["Campus", campusName],
        ["Academic year / term", termLabel],
        ["Level", levelDef.label],
        ["Colleges (campus)", String(collegeCount)],
        ["Academic programs (system)", String(programCount)],
        ["Enrolled students (term)", String(students.length)],
      ],
    });
  } else if (reportKey === "summary_of_enrollment") {
    const byCollege = new Map<string, number>();
    const byYear = new Map<string, number>();
    for (const s of students) {
      const cc = cell(s.college_code) || cell(s.college) || "—";
      byCollege.set(cc, (byCollege.get(cc) ?? 0) + 1);
      const yl = cell(s.year_level) || "—";
      byYear.set(yl, (byYear.get(yl) ?? 0) + 1);
    }
    sections.push({
      heading: "By college",
      columns: ["College", "Headcount"],
      rows: [...byCollege.entries()].map(([k, v]) => [k, String(v)]),
    });
    sections.push({
      heading: "By year level",
      columns: ["Year level", "Headcount"],
      rows: [...byYear.entries()].map(([k, v]) => [k, String(v)]),
    });
    sections.push({
      heading: "Total",
      columns: ["Description", "Count"],
      rows: [["Total enrollment", String(students.length)]],
    });
  } else if (reportKey === "enrollment_list" || reportKey === "inventory_enrolled_students") {
    sections.push({
      heading: reportDef.label,
      columns: ["Student no.", "Name", "College", "Program", "Year level"],
      rows: students.map((s) => [
        cell(s.student_no),
        cell(s.student_name),
        cell(s.college),
        cell(s.program),
        cell(s.year_level),
      ]),
    });
  } else if (reportKey === "ched_form_xix") {
    sections.push({
      heading: "CHED form XIX — enrollment",
      columns: ["#", "Student no.", "Name", "Program", "Year level", "GWA"],
      rows: students.map((s, i) => [
        String(i + 1),
        cell(s.student_no),
        cell(s.student_name),
        cell(s.program),
        cell(s.year_level),
        cell(s.gwa),
      ]),
    });
  } else if (reportKey === "inventory_academic_programs" || reportKey === "total_campus_programs") {
    let progRows: string[][] = [];
    try {
      const { rows } = await pool.query(
        `
        SELECT p.program_code, p.program_name, c.college_code, c.college_name
        FROM academic_programs p
        LEFT JOIN colleges c ON c.id = p.college_id
        WHERE c.campus_id = $1 OR c.campus_id IS NULL
        ORDER BY c.college_code NULLS LAST, p.program_code NULLS LAST
      `,
        [params.campusId]
      );
      progRows = rows
        .filter((r) => {
          const name = String((r as Record<string, unknown>).program_name ?? "");
          const masteral = isMasteralProgram(name);
          return level === "masteral" ? masteral : !masteral;
        })
        .map((r) => {
          const row = r as Record<string, unknown>;
          return [
            cell(row.college_code),
            cell(row.college_name),
            cell(row.program_code),
            cell(row.program_name),
          ];
        });
    } catch {
      /* noop */
    }
    sections.push({
      heading: reportDef.label,
      columns: ["College code", "College name", "Program code", "Program name"],
      rows: progRows,
    });
    if (reportKey === "total_campus_programs") {
      sections.push({
        heading: "Summary",
        columns: ["Metric", "Count"],
        rows: [["Total programs listed", String(progRows.length)]],
      });
    }
  } else if (reportKey === "list_foreign_students") {
    sections.push({
      heading: "List of foreign students",
      columns: ["Note"],
      rows: [
        [
          "No nationality field is stored in the current enrollment summary. Tag students in the student master when nationality tracking is enabled.",
        ],
      ],
    });
  } else {
    sections.push({
      heading: reportDef.label,
      columns: ["Message"],
      rows: [["Report data is not available for this selection."]],
    });
  }

  return {
    report_key: reportDef.key,
    report_label: reportDef.label,
    level,
    level_label: levelDef.label,
    term_label: termLabel,
    campus_name: campusName,
    sections,
  };
}
