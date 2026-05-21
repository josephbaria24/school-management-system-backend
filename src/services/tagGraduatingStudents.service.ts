import pool from "../db.js";
import { lookupEnrollmentSnapshot } from "./correctionOfGrades.service.js";
import { searchReportStudents } from "./reportOfGrades.service.js";

const T_TAG = "tag_graduating_student";
const T_SUMMARY = "student_grade_summary";

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_TAG} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      campus_id INT NOT NULL,
      student_no VARCHAR(64) NOT NULL,
      student_name VARCHAR(240),
      college_code VARCHAR(32),
      program_code VARCHAR(300),
      major_study VARCHAR(300),
      year_level VARCHAR(32),
      curriculum_total_load VARCHAR(64),
      date_entry TIMESTAMPTZ,
      graduation_fee_template VARCHAR(120),
      remarks VARCHAR(500),
      graduation_application_approved BOOLEAN NOT NULL DEFAULT FALSE,
      date_graduated DATE,
      voided BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_graduating_student_active
     ON ${T_TAG} (academic_year_term_id, campus_id, UPPER(TRIM(student_no)))
     WHERE voided = FALSE`
  );
};

export type GraduatingStudentRow = {
  id: number;
  student_no: string;
  student_name: string | null;
  college_code: string | null;
  program_code: string | null;
  major_study: string | null;
  year_level: string | null;
  curriculum_total_load: string | null;
  date_entry: string | null;
  graduation_fee_template: string | null;
  remarks: string | null;
  graduation_application_approved: boolean;
  date_graduated: string | null;
  voided: boolean;
};

export type MassCandidateRow = {
  student_no: string;
  student_name: string | null;
  college_code: string | null;
  program_code: string | null;
  major_study: string | null;
  year_level: string | null;
  curriculum_total_load: string | null;
  already_tagged: boolean;
};

export type StudentProfile = {
  student_no: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  ext_name: string;
  college: string;
  academic_program: string;
  major_study: string;
  year_level: string;
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
    const first = rest[0] ?? "";
    const middle = rest.slice(1).join(" ");
    return { last, first, middle, ext: "" };
  }
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { last: parts[0], first: "", middle: "", ext: "" };
  return { last: parts[parts.length - 1] ?? "", first: parts[0] ?? "", middle: parts.slice(1, -1).join(" "), ext: "" };
}

function mapTagRow(r: Record<string, unknown>): GraduatingStudentRow {
  return {
    id: Number(r.id),
    student_no: String(r.student_no),
    student_name: r.student_name == null ? null : String(r.student_name),
    college_code: r.college_code == null ? null : String(r.college_code),
    program_code: r.program_code == null ? null : String(r.program_code),
    major_study: r.major_study == null ? null : String(r.major_study),
    year_level: r.year_level == null ? null : String(r.year_level),
    curriculum_total_load: r.curriculum_total_load == null ? null : String(r.curriculum_total_load),
    date_entry: r.date_entry == null ? null : String(r.date_entry),
    graduation_fee_template: r.graduation_fee_template == null ? null : String(r.graduation_fee_template),
    remarks: r.remarks == null ? null : String(r.remarks),
    graduation_application_approved: Boolean(r.graduation_application_approved),
    date_graduated:
      r.date_graduated == null
        ? null
        : r.date_graduated instanceof Date
          ? r.date_graduated.toISOString().slice(0, 10)
          : String(r.date_graduated).slice(0, 10),
    voided: Boolean(r.voided),
  };
}

export function getTagGraduatingOptions() {
  return {
    graduation_fee_templates: [
      { key: "default", label: "Default graduation fee" },
      { key: "standard", label: "Standard graduation fee" },
      { key: "honors", label: "Honors graduation fee" },
    ],
  };
}

export { searchReportStudents };

export async function listTaggedStudents(params: {
  academicYearTermId: number;
  campusId: number;
}): Promise<GraduatingStudentRow[]> {
  await ensureTable();
  const { rows } = await pool.query(
    `
    SELECT *
    FROM ${T_TAG}
    WHERE academic_year_term_id = $1 AND campus_id = $2 AND voided = FALSE
    ORDER BY student_name NULLS LAST, student_no ASC
  `,
    [params.academicYearTermId, params.campusId]
  );
  return rows.map((r) => mapTagRow(r as Record<string, unknown>));
}

export async function getStudentTagWorkspace(params: {
  academicYearTermId: number;
  campusId: number;
  studentNo: string;
}): Promise<{ profile: StudentProfile; tag: GraduatingStudentRow | null }> {
  await ensureTable();
  const sn = params.studentNo.trim();
  const snap = await lookupEnrollmentSnapshot(params.academicYearTermId, sn);
  const { last, first, middle, ext } = parseStudentName(snap?.student_name);
  const profile: StudentProfile = {
    student_no: sn,
    last_name: last,
    first_name: first,
    middle_name: middle,
    ext_name: ext,
    college: snap?.college ?? "",
    academic_program: snap?.program ?? "",
    major_study: "",
    year_level: snap?.year_level ?? "",
  };

  const { rows } = await pool.query(
    `
    SELECT *
    FROM ${T_TAG}
    WHERE academic_year_term_id = $1 AND campus_id = $2
      AND UPPER(TRIM(student_no)) = UPPER(TRIM($3))
      AND voided = FALSE
    LIMIT 1
  `,
    [params.academicYearTermId, params.campusId, sn]
  );

  return {
    profile,
    tag: rows.length ? mapTagRow(rows[0] as Record<string, unknown>) : null,
  };
}

export async function saveGraduatingTag(params: {
  academicYearTermId: number;
  campusId: number;
  studentNo: string;
  dateEntry?: string;
  graduationFeeTemplate?: string;
  remarks?: string;
  graduationApplicationApproved?: boolean;
  collegeCode?: string;
  programCode?: string;
  majorStudy?: string;
  yearLevel?: string;
  curriculumTotalLoad?: string;
}): Promise<GraduatingStudentRow> {
  await ensureTable();
  const sn = params.studentNo.trim();
  const snap = await lookupEnrollmentSnapshot(params.academicYearTermId, sn);

  let collegeCode = (params.collegeCode ?? "").trim();
  let programCode = (params.programCode ?? "").trim();
  let yearLevel = (params.yearLevel ?? "").trim();
  let curriculumLoad = (params.curriculumTotalLoad ?? "").trim();
  const studentName = snap?.student_name ?? null;

  if (!collegeCode || !programCode) {
    try {
      const { rows } = await pool.query(
        `
        SELECT college_code, program, year_level, credit_units_enrolled
        FROM ${T_SUMMARY}
        WHERE academic_year_term_id = $1 AND campus_id = $2
          AND UPPER(TRIM(student_no)) = UPPER(TRIM($3))
        LIMIT 1
      `,
        [params.academicYearTermId, params.campusId, sn]
      );
      if (rows.length) {
        const r = rows[0] as Record<string, unknown>;
        collegeCode = collegeCode || String(r.college_code ?? "").trim();
        programCode = programCode || String(r.program ?? "").trim();
        yearLevel = yearLevel || String(r.year_level ?? "").trim();
        if (!curriculumLoad && r.credit_units_enrolled != null) {
          curriculumLoad = String(r.credit_units_enrolled);
        }
      }
    } catch {
      /* noop */
    }
  }

  const dateEntry = params.dateEntry?.trim() ? params.dateEntry.trim() : new Date().toISOString();
  const feeTemplate = (params.graduationFeeTemplate ?? "default").trim() || "default";
  const remarks = (params.remarks ?? "").trim();
  const approved = Boolean(params.graduationApplicationApproved);
  const dateGraduated = dateEntry.slice(0, 10);

  const { rows: existing } = await pool.query(
    `
    SELECT id FROM ${T_TAG}
    WHERE academic_year_term_id = $1 AND campus_id = $2
      AND UPPER(TRIM(student_no)) = UPPER(TRIM($3))
      AND voided = FALSE
    LIMIT 1
  `,
    [params.academicYearTermId, params.campusId, sn]
  );

  if (existing.length) {
    const id = Number((existing[0] as Record<string, unknown>).id);
    const { rows } = await pool.query(
      `
      UPDATE ${T_TAG}
      SET student_name = $1, college_code = $2, program_code = $3, major_study = $4,
          year_level = $5, curriculum_total_load = $6, date_entry = $7::timestamptz,
          graduation_fee_template = $8, remarks = $9, graduation_application_approved = $10,
          date_graduated = $11::date, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `,
      [
        studentName,
        collegeCode || null,
        programCode || null,
        (params.majorStudy ?? "").trim() || null,
        yearLevel || null,
        curriculumLoad || null,
        dateEntry,
        feeTemplate,
        remarks || null,
        approved,
        dateGraduated,
        id,
      ]
    );
    return mapTagRow(rows[0] as Record<string, unknown>);
  }

  const { rows } = await pool.query(
    `
    INSERT INTO ${T_TAG} (
      academic_year_term_id, campus_id, student_no, student_name, college_code, program_code,
      major_study, year_level, curriculum_total_load, date_entry, graduation_fee_template,
      remarks, graduation_application_approved, date_graduated
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $11, $12, $13, $14::date)
    RETURNING *
  `,
    [
      params.academicYearTermId,
      params.campusId,
      sn,
      studentName,
      collegeCode || null,
      programCode || null,
      (params.majorStudy ?? "").trim() || null,
      yearLevel || null,
      curriculumLoad || null,
      dateEntry,
      feeTemplate,
      remarks || null,
      approved,
      dateGraduated,
    ]
  );
  return mapTagRow(rows[0] as Record<string, unknown>);
}

export async function voidGraduatingTag(id: number): Promise<void> {
  await ensureTable();
  await pool.query(`UPDATE ${T_TAG} SET voided = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
}

export async function listMassCandidates(params: {
  academicYearTermId: number;
  campusId: number;
  collegeCode?: string;
  program?: string;
  yearLevel?: string;
}): Promise<MassCandidateRow[]> {
  await ensureTable();

  let sql = `
    SELECT DISTINCT s.student_no, s.student_name, s.college_code, s.program AS program_code,
           s.year_level, s.credit_units_enrolled::text AS curriculum_total_load
    FROM ${T_SUMMARY} s
    WHERE s.academic_year_term_id = $1 AND s.campus_id = $2
  `;
  const qparams: Array<number | string> = [params.academicYearTermId, params.campusId];
  let idx = 3;

  const cc = (params.collegeCode ?? "").trim();
  if (cc) {
    sql += ` AND UPPER(TRIM(s.college_code)) = UPPER(TRIM($${idx}))`;
    qparams.push(cc);
    idx += 1;
  }

  const prog = (params.program ?? "").trim();
  if (prog) {
    sql += ` AND COALESCE(s.program, '') ILIKE $${idx}`;
    qparams.push(`%${prog}%`);
    idx += 1;
  }

  const yl = (params.yearLevel ?? "").trim();
  if (yl && !/^all/i.test(yl)) {
    sql += ` AND COALESCE(s.year_level, '') ILIKE $${idx}`;
    qparams.push(`%${yl}%`);
    idx += 1;
  }

  sql += ` ORDER BY s.student_name NULLS LAST, s.student_no ASC`;

  let summaryRows: Record<string, unknown>[] = [];
  try {
    const { rows } = await pool.query(sql, qparams);
    summaryRows = rows as Record<string, unknown>[];
  } catch {
    return [];
  }

  const tagged = new Set<string>();
  try {
    const { rows } = await pool.query(
      `
      SELECT UPPER(TRIM(student_no)) AS sn
      FROM ${T_TAG}
      WHERE academic_year_term_id = $1 AND campus_id = $2 AND voided = FALSE
    `,
      [params.academicYearTermId, params.campusId]
    );
    for (const r of rows) {
      tagged.add(String((r as Record<string, unknown>).sn));
    }
  } catch {
    /* noop */
  }

  return summaryRows.map((r) => {
    const sn = String(r.student_no).trim();
    return {
      student_no: sn,
      student_name: r.student_name == null ? null : String(r.student_name),
      college_code: r.college_code == null ? null : String(r.college_code),
      program_code: r.program_code == null ? null : String(r.program_code),
      major_study: null,
      year_level: r.year_level == null ? null : String(r.year_level),
      curriculum_total_load: r.curriculum_total_load == null ? null : String(r.curriculum_total_load),
      already_tagged: tagged.has(sn.toUpperCase()),
    };
  });
}

export async function massTagGraduatingStudents(params: {
  academicYearTermId: number;
  campusId: number;
  studentNos: string[];
  graduationFeeTemplate?: string;
  remarks?: string;
  graduationApplicationApproved?: boolean;
}): Promise<{ tagged: number; skipped: number }> {
  let tagged = 0;
  let skipped = 0;
  const fee = (params.graduationFeeTemplate ?? "default").trim() || "default";
  const remarks = (params.remarks ?? "").trim();
  const approved = Boolean(params.graduationApplicationApproved);

  for (const sn of params.studentNos) {
    const trimmed = sn.trim();
    if (!trimmed) continue;
    try {
      const existing = await getStudentTagWorkspace({
        academicYearTermId: params.academicYearTermId,
        campusId: params.campusId,
        studentNo: trimmed,
      });
      if (existing.tag) {
        skipped += 1;
        continue;
      }
      await saveGraduatingTag({
        academicYearTermId: params.academicYearTermId,
        campusId: params.campusId,
        studentNo: trimmed,
        graduationFeeTemplate: fee,
        remarks,
        graduationApplicationApproved: approved,
        majorStudy: existing.profile.major_study,
      });
      tagged += 1;
    } catch {
      skipped += 1;
    }
  }
  return { tagged, skipped };
}
