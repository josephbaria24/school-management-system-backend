import pool from "../db.js";
import { lookupEnrollmentSnapshot } from "./correctionOfGrades.service.js";
import { resolveReportStudents, type ReportStudentPick } from "./reportOfGrades.service.js";

const T_GRADES = "grade_encoding_line";

export const WORKSHEET_LAYOUTS = [
  { key: "default", label: "Default layout" },
  { key: "midterm", label: "Midterm" },
  { key: "full", label: "Midterm and final" },
] as const;

export const WORKSHEET_SORT_OPTIONS = [
  { key: "name", label: "Last name, first name" },
  { key: "student_no", label: "Student number" },
  { key: "year_level", label: "Year level" },
] as const;

export type WorksheetCourseColumn = {
  key: string;
  course_code: string;
  course_title: string;
  class_section: string;
};

export type WorksheetStudentRow = {
  student_no: string;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
  grades: Record<string, string>;
};

export type WorksheetPreview = {
  layout: string;
  layout_label: string;
  term_label: string;
  campus_name: string;
  college_label: string | null;
  program_label: string | null;
  courses: WorksheetCourseColumn[];
  students: WorksheetStudentRow[];
};

function courseKey(code: string | null, section: string | null): string {
  return `${(code ?? "").trim()}|${(section ?? "").trim()}`.toUpperCase();
}

function formatGrade(
  layout: string,
  midterm: string | null,
  final: string | null,
  reExam: string | null
): string {
  const m = (midterm ?? "").trim();
  const f = (final ?? "").trim();
  const r = (reExam ?? "").trim();
  const key = layout.trim().toLowerCase();
  if (key === "midterm") return m || "—";
  if (key === "full") {
    const parts = [m && `M:${m}`, f && `F:${f}`, r && `R:${r}`].filter(Boolean);
    return parts.length ? parts.join(" ") : "—";
  }
  if (r && f) return `${f} (${r})`;
  return f || m || "—";
}

export function getWorksheetOptions() {
  return {
    layouts: WORKSHEET_LAYOUTS.map((l) => ({ key: l.key, label: l.label })),
    sort_options: WORKSHEET_SORT_OPTIONS.map((s) => ({ key: s.key, label: s.label })),
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

export async function buildWorksheetPreview(params: {
  academicYearTermId: number;
  campusId: number;
  layout: string;
  collegeCode?: string;
  program?: string;
  yearLevel?: string;
  sortBy?: string;
}): Promise<WorksheetPreview> {
  const layout = params.layout.trim() || "default";
  const layoutDef = WORKSHEET_LAYOUTS.find((l) => l.key === layout) ?? WORKSHEET_LAYOUTS[0];
  const sortBy = params.sortBy?.trim() || "name";

  const resolved = await resolveReportStudents({
    academicYearTermId: params.academicYearTermId,
    campusId: params.campusId,
    collegeCode: params.collegeCode,
    program: params.program,
    yearLevel: params.yearLevel,
    sortBy,
  });

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

  let collegeLabel: string | null = null;
  const cc = (params.collegeCode ?? "").trim();
  if (cc) {
    try {
      const { rows } = await pool.query(
        `SELECT college_code, college_name FROM colleges WHERE UPPER(TRIM(college_code)) = UPPER(TRIM($1)) LIMIT 1`,
        [cc]
      );
      if (rows.length) {
        const r = rows[0] as Record<string, unknown>;
        collegeLabel = [r.college_code, r.college_name].filter(Boolean).join(" — ").trim() || cc;
      } else {
        collegeLabel = cc;
      }
    } catch {
      collegeLabel = cc;
    }
  }

  const programLabel = (params.program ?? "").trim() || null;

  if (!resolved.length) {
    return {
      layout,
      layout_label: layoutDef.label,
      term_label: termLabel,
      campus_name: campusName,
      college_label: collegeLabel,
      program_label: programLabel,
      courses: [],
      students: [],
    };
  }

  const studentNos = resolved.map((r) => r.student_no);
  const studentMap = new Map<string, ReportStudentPick>();
  for (const s of resolved) {
    studentMap.set(s.student_no.toUpperCase(), s);
  }

  const { rows: gradeRows } = await pool.query(
    `
    SELECT student_no, course_code, course_title, class_section, midterm, final, re_exam, sort_order
    FROM ${T_GRADES}
    WHERE academic_year_term_id = $1
      AND UPPER(TRIM(student_no)) = ANY(
        SELECT UPPER(TRIM(x)) FROM UNNEST($2::text[]) AS x
      )
    ORDER BY sort_order ASC, course_code ASC, class_section ASC, id ASC
  `,
    [params.academicYearTermId, studentNos]
  );

  const courseMap = new Map<string, WorksheetCourseColumn>();
  const gradesByStudent = new Map<string, Record<string, string>>();

  for (const row of gradeRows) {
    const r = row as Record<string, unknown>;
    const sn = String(r.student_no).trim();
    const code = r.course_code == null ? "" : String(r.course_code);
    const section = r.class_section == null ? "" : String(r.class_section);
    const key = courseKey(code, section);

    if (!courseMap.has(key)) {
      courseMap.set(key, {
        key,
        course_code: code,
        course_title: r.course_title == null ? "" : String(r.course_title),
        class_section: section,
      });
    }

    const gradeCell = formatGrade(
      layout,
      r.midterm == null ? null : String(r.midterm),
      r.final == null ? null : String(r.final),
      r.re_exam == null ? null : String(r.re_exam)
    );

    const studentGrades = gradesByStudent.get(sn.toUpperCase()) ?? {};
    studentGrades[key] = gradeCell;
    gradesByStudent.set(sn.toUpperCase(), studentGrades);
  }

  const courses = [...courseMap.values()].sort((a, b) => {
    const ac = a.course_code.localeCompare(b.course_code);
    if (ac !== 0) return ac;
    return a.class_section.localeCompare(b.class_section);
  });

  const students: WorksheetStudentRow[] = [];
  for (const pick of resolved) {
    const sn = pick.student_no.trim();
    let name = pick.student_name;
    let college = pick.college;
    let program = pick.program;
    let yearLevel = pick.year_level;

    if (!name) {
      const snap = await lookupEnrollmentSnapshot(params.academicYearTermId, sn);
      if (snap) {
        name = snap.student_name;
        college = college ?? snap.college;
        program = program ?? snap.program;
        yearLevel = yearLevel ?? snap.year_level;
      }
    }

    students.push({
      student_no: sn,
      student_name: name,
      college,
      program,
      year_level: yearLevel,
      grades: gradesByStudent.get(sn.toUpperCase()) ?? {},
    });
  }

  return {
    layout,
    layout_label: layoutDef.label,
    term_label: termLabel,
    campus_name: campusName,
    college_label: collegeLabel,
    program_label: programLabel,
    courses,
    students,
  };
}
