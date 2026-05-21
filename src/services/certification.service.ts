import pool from "../db.js";
import { lookupEnrollmentSnapshot } from "./correctionOfGrades.service.js";
import { searchReportStudents, type ReportStudentPick } from "./reportOfGrades.service.js";

const T_HISTORY = "registrar_certification_print_history";
const T_SIGNATORY = "registrar_certification_signatory";
const T_GRADES = "grade_encoding_line";
const T_TAG = "tag_graduating_student";

export const CERTIFICATE_TYPES = [
  { key: "enrolment", label: "Enrolment" },
  { key: "grades", label: "Grades" },
  { key: "attendance", label: "Attendance" },
  { key: "course_description", label: "Course description" },
  { key: "honorable_dismissal", label: "Honorable dismissal" },
  { key: "graduation", label: "Graduation" },
] as const;

export const PURPOSE_OPTIONS = [
  { key: "visa", label: "For visa purposes" },
  { key: "educational_plan", label: "For educational plan" },
  { key: "employment", label: "For employment" },
  { key: "further_studies", label: "For further studies" },
  { key: "other", label: "Other remarks" },
] as const;

const ensureTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_SIGNATORY} (
      id SERIAL PRIMARY KEY,
      certificate_type VARCHAR(64) NOT NULL DEFAULT 'enrolment',
      signatory_name VARCHAR(240) NOT NULL DEFAULT '',
      signatory_title VARCHAR(240) NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_HISTORY} (
      id SERIAL PRIMARY KEY,
      student_no VARCHAR(64) NOT NULL,
      certificate_type VARCHAR(64) NOT NULL,
      or_no VARCHAR(64),
      issued_to VARCHAR(240),
      issued_on DATE,
      date_request DATE,
      date_release DATE,
      purpose_key VARCHAR(64),
      purpose_remarks TEXT,
      final_copy BOOLEAN NOT NULL DEFAULT FALSE,
      payload JSONB,
      printed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_registrar_cert_history_student ON ${T_HISTORY} (student_no, printed_at DESC)`
  );
};

export type CertificationStudentProfile = {
  student_no: string;
  status: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  ext_name: string;
  gender: string;
  age: string;
  college: string;
  year_level: string;
  academic_program: string;
  major_study: string;
  graduate_remarks: string;
  so_number: string;
  res_number: string;
  date_graduated: string;
};

export type StudentTermOption = {
  academic_year_term_id: number;
  label: string;
};

export type SignatoryRow = {
  id: number;
  certificate_type: string;
  signatory_name: string;
  signatory_title: string;
  sort_order: number;
};

export type PrintHistoryRow = {
  id: number;
  student_no: string;
  certificate_type: string;
  or_no: string | null;
  issued_to: string | null;
  issued_on: string | null;
  date_request: string | null;
  date_release: string | null;
  purpose_key: string | null;
  purpose_remarks: string | null;
  final_copy: boolean;
  printed_at: string | null;
};

export type CertificationPreview = {
  certificate_type: string;
  certificate_label: string;
  student: CertificationStudentProfile;
  selected_terms: string[];
  purpose_label: string;
  or_no: string;
  issued_to: string;
  issued_on: string;
  date_request: string;
  date_release: string;
  include_credited_courses: boolean;
  include_summer_cgpa: boolean;
  include_other_school_grades: boolean;
  signatories: SignatoryRow[];
  grade_lines: Array<{
    term_label: string;
    course_code: string | null;
    course_title: string | null;
    unit: string | null;
    final: string | null;
    remark: string | null;
  }>;
};

function parseStudentName(full: string | null | undefined): {
  last: string;
  first: string;
  middle: string;
  ext: string;
} {
  const s = (full ?? "").trim();
  if (!s) return { last: "", first: "", middle: "", ext: "" };
  const comma = s.indexOf(",");
  if (comma >= 0) {
    const last = s.slice(0, comma).trim();
    const rest = s.slice(comma + 1).trim().split(/\s+/).filter(Boolean);
    return { last, first: rest[0] ?? "", middle: rest.slice(1).join(" "), ext: "" };
  }
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { last: parts[0], first: "", middle: "", ext: "" };
  return { last: parts[parts.length - 1] ?? "", first: parts[0] ?? "", middle: parts.slice(1, -1).join(" "), ext: "" };
}

function formatDate(d: unknown): string {
  if (d == null) return "";
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export function getCertificationOptions() {
  return {
    certificate_types: CERTIFICATE_TYPES.map((c) => ({ key: c.key, label: c.label })),
    purpose_options: PURPOSE_OPTIONS.map((p) => ({ key: p.key, label: p.label })),
  };
}

export { searchReportStudents, type ReportStudentPick };

export async function getCertificationStudent(params: {
  academicYearTermId: number;
  campusId: number;
  studentNo: string;
}): Promise<{ profile: CertificationStudentProfile; terms: StudentTermOption[] }> {
  await ensureTables();
  const sn = params.studentNo.trim();
  const snap = await lookupEnrollmentSnapshot(params.academicYearTermId, sn);
  const { last, first, middle, ext } = parseStudentName(snap?.student_name);

  let graduateRemarks = "";
  let soNumber = "";
  let resNumber = "";
  let dateGraduated = "";
  try {
    const { rows } = await pool.query(
      `
      SELECT remarks, date_graduated
      FROM ${T_TAG}
      WHERE campus_id = $1 AND UPPER(TRIM(student_no)) = UPPER(TRIM($2)) AND voided = FALSE
      ORDER BY date_graduated DESC NULLS LAST, id DESC
      LIMIT 1
    `,
      [params.campusId, sn]
    );
    if (rows.length) {
      const r = rows[0] as Record<string, unknown>;
      graduateRemarks = r.remarks == null ? "" : String(r.remarks);
      dateGraduated = formatDate(r.date_graduated);
    }
  } catch {
    /* noop */
  }

  const profile: CertificationStudentProfile = {
    student_no: sn,
    status: "Active",
    last_name: last,
    first_name: first,
    middle_name: middle,
    ext_name: ext,
    gender: "",
    age: "",
    college: snap?.college ?? "",
    year_level: snap?.year_level ?? "",
    academic_program: snap?.program ?? "",
    major_study: "",
    graduate_remarks: graduateRemarks,
    so_number: soNumber,
    res_number: resNumber,
    date_graduated: dateGraduated,
  };

  const terms = await listStudentTerms(sn);
  return { profile, terms };
}

export async function listStudentTerms(studentNo: string): Promise<StudentTermOption[]> {
  const sn = studentNo.trim();
  try {
    const { rows } = await pool.query(
      `
      SELECT DISTINCT t.id, t.academic_year, t.term
      FROM ${T_GRADES} g
      JOIN academic_year_terms t ON t.id = g.academic_year_term_id
      WHERE g.student_no = $1
      ORDER BY t.academic_year DESC, t.term DESC
    `,
      [sn]
    );
    return rows.map((r) => {
      const row = r as Record<string, unknown>;
      const id = Number(row.id);
      const label = `${row.academic_year ?? ""} ${row.term ?? ""}`.trim();
      return { academic_year_term_id: id, label };
    });
  } catch {
    return [];
  }
}

export async function listSignatories(certificateType: string): Promise<SignatoryRow[]> {
  await ensureTables();
  const ct = certificateType.trim() || "enrolment";
  const { rows } = await pool.query(
    `SELECT * FROM ${T_SIGNATORY} WHERE certificate_type = $1 ORDER BY sort_order ASC, id ASC`,
    [ct]
  );
  if (!rows.length) {
    return [
      {
        id: 0,
        certificate_type: ct,
        signatory_name: "Registrar",
        signatory_title: "University Registrar",
        sort_order: 0,
      },
    ];
  }
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.id),
      certificate_type: String(row.certificate_type),
      signatory_name: String(row.signatory_name ?? ""),
      signatory_title: String(row.signatory_title ?? ""),
      sort_order: Number(row.sort_order ?? 0),
    };
  });
}

export async function saveSignatories(
  certificateType: string,
  rows: Array<{ signatory_name: string; signatory_title: string; sort_order?: number }>
): Promise<SignatoryRow[]> {
  await ensureTables();
  const ct = certificateType.trim() || "enrolment";
  await pool.query(`DELETE FROM ${T_SIGNATORY} WHERE certificate_type = $1`, [ct]);
  let order = 0;
  for (const row of rows) {
    const name = row.signatory_name.trim();
    if (!name) continue;
    await pool.query(
      `INSERT INTO ${T_SIGNATORY} (certificate_type, signatory_name, signatory_title, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [ct, name, row.signatory_title.trim(), row.sort_order ?? order]
    );
    order += 1;
  }
  return listSignatories(ct);
}

export async function listPrintHistory(studentNo: string): Promise<PrintHistoryRow[]> {
  await ensureTables();
  const { rows } = await pool.query(
    `SELECT * FROM ${T_HISTORY} WHERE UPPER(TRIM(student_no)) = UPPER(TRIM($1)) ORDER BY printed_at DESC LIMIT 50`,
    [studentNo.trim()]
  );
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.id),
      student_no: String(row.student_no),
      certificate_type: String(row.certificate_type),
      or_no: row.or_no == null ? null : String(row.or_no),
      issued_to: row.issued_to == null ? null : String(row.issued_to),
      issued_on: row.issued_on == null ? null : formatDate(row.issued_on),
      date_request: row.date_request == null ? null : formatDate(row.date_request),
      date_release: row.date_release == null ? null : formatDate(row.date_release),
      purpose_key: row.purpose_key == null ? null : String(row.purpose_key),
      purpose_remarks: row.purpose_remarks == null ? null : String(row.purpose_remarks),
      final_copy: Boolean(row.final_copy),
      printed_at: row.printed_at == null ? null : String(row.printed_at),
    };
  });
}

export async function buildCertificationPreview(params: {
  academicYearTermId: number;
  campusId: number;
  studentNo: string;
  certificateType: string;
  termIds: number[];
  orNo?: string;
  issuedTo?: string;
  issuedOn?: string;
  dateRequest?: string;
  dateRelease?: string;
  purposeKey?: string;
  purposeRemarks?: string;
  includeCreditedCourses?: boolean;
  includeSummerCgpa?: boolean;
  includeOtherSchoolGrades?: boolean;
  finalCopy?: boolean;
}): Promise<CertificationPreview> {
  const { profile, terms: allTerms } = await getCertificationStudent({
    academicYearTermId: params.academicYearTermId,
    campusId: params.campusId,
    studentNo: params.studentNo,
  });

  const certKey = params.certificateType.trim() || "enrolment";
  const certDef = CERTIFICATE_TYPES.find((c) => c.key === certKey) ?? CERTIFICATE_TYPES[0];
  const purposeDef = PURPOSE_OPTIONS.find((p) => p.key === (params.purposeKey ?? "").trim());

  const termIdSet = new Set(
    (params.termIds.length ? params.termIds : allTerms.map((t) => t.academic_year_term_id)).filter(Boolean)
  );
  const selectedLabels = allTerms
    .filter((t) => termIdSet.has(t.academic_year_term_id))
    .map((t) => t.label);

  const signatories = await listSignatories(certKey);

  const gradeLines: CertificationPreview["grade_lines"] = [];
  if (termIdSet.size) {
    try {
      const { rows } = await pool.query(
        `
        SELECT g.*, t.academic_year, t.term
        FROM ${T_GRADES} g
        JOIN academic_year_terms t ON t.id = g.academic_year_term_id
        WHERE g.student_no = $1 AND g.academic_year_term_id = ANY($2::int[])
        ORDER BY t.academic_year DESC, t.term DESC, g.sort_order ASC, g.id ASC
      `,
        [params.studentNo.trim(), [...termIdSet]]
      );
      for (const row of rows) {
        const r = row as Record<string, unknown>;
        const ay = String(r.academic_year ?? "");
        const tm = String(r.term ?? "");
        const summer = Boolean(r.is_summer_term);
        if (!params.includeSummerCgpa && /summer/i.test(tm + ay)) continue;
        if (!params.includeCreditedCourses && Boolean(r.not_credited)) continue;
        gradeLines.push({
          term_label: `${ay} ${tm}`.trim(),
          course_code: r.course_code == null ? null : String(r.course_code),
          course_title: r.course_title == null ? null : String(r.course_title),
          unit: r.unit == null ? null : String(r.unit),
          final: r.final == null ? null : String(r.final),
          remark: r.remark == null ? null : String(r.remark),
        });
      }
    } catch {
      /* noop */
    }
  }

  return {
    certificate_type: certKey,
    certificate_label: certDef.label,
    student: profile,
    selected_terms: selectedLabels,
    purpose_label: purposeDef?.label ?? params.purposeRemarks?.trim() ?? "",
    or_no: (params.orNo ?? "").trim(),
    issued_to: (params.issuedTo ?? "").trim() || profile.student_no,
    issued_on: (params.issuedOn ?? "").trim(),
    date_request: (params.dateRequest ?? "").trim(),
    date_release: (params.dateRelease ?? "").trim(),
    include_credited_courses: Boolean(params.includeCreditedCourses),
    include_summer_cgpa: Boolean(params.includeSummerCgpa),
    include_other_school_grades: Boolean(params.includeOtherSchoolGrades),
    signatories,
    grade_lines: gradeLines,
  };
}

export async function recordPrintHistory(params: {
  studentNo: string;
  certificateType: string;
  orNo?: string;
  issuedTo?: string;
  issuedOn?: string;
  dateRequest?: string;
  dateRelease?: string;
  purposeKey?: string;
  purposeRemarks?: string;
  finalCopy?: boolean;
  payload?: unknown;
}): Promise<PrintHistoryRow> {
  await ensureTables();
  const { rows } = await pool.query(
    `
    INSERT INTO ${T_HISTORY} (
      student_no, certificate_type, or_no, issued_to, issued_on, date_request, date_release,
      purpose_key, purpose_remarks, final_copy, payload
    ) VALUES ($1, $2, $3, $4, $5::date, $6::date, $7::date, $8, $9, $10, $11::jsonb)
    RETURNING *
  `,
    [
      params.studentNo.trim(),
      params.certificateType.trim() || "enrolment",
      (params.orNo ?? "").trim() || null,
      (params.issuedTo ?? "").trim() || null,
      (params.issuedOn ?? "").trim() || null,
      (params.dateRequest ?? "").trim() || null,
      (params.dateRelease ?? "").trim() || null,
      (params.purposeKey ?? "").trim() || null,
      (params.purposeRemarks ?? "").trim() || null,
      Boolean(params.finalCopy),
      JSON.stringify(params.payload ?? {}),
    ]
  );
  const row = rows[0] as Record<string, unknown>;
  return {
    id: Number(row.id),
    student_no: String(row.student_no),
    certificate_type: String(row.certificate_type),
    or_no: row.or_no == null ? null : String(row.or_no),
    issued_to: row.issued_to == null ? null : String(row.issued_to),
    issued_on: row.issued_on == null ? null : formatDate(row.issued_on),
    date_request: row.date_request == null ? null : formatDate(row.date_request),
    date_release: row.date_release == null ? null : formatDate(row.date_release),
    purpose_key: row.purpose_key == null ? null : String(row.purpose_key),
    purpose_remarks: row.purpose_remarks == null ? null : String(row.purpose_remarks),
    final_copy: Boolean(row.final_copy),
    printed_at: row.printed_at == null ? null : String(row.printed_at),
  };
}
