import pool from "../db.js";

const T_TAG = "tag_graduating_student";
const T_SUMMARY = "student_grade_summary";

const ensureColumns = async () => {
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
  await pool.query(`
    ALTER TABLE ${T_TAG}
      ADD COLUMN IF NOT EXISTS gender VARCHAR(8),
      ADD COLUMN IF NOT EXISTS honor VARCHAR(120),
      ADD COLUMN IF NOT EXISTS billing_no VARCHAR(64),
      ADD COLUMN IF NOT EXISTS or_no VARCHAR(64),
      ADD COLUMN IF NOT EXISTS validating_officer_id VARCHAR(64),
      ADD COLUMN IF NOT EXISTS validation_date DATE
  `);
};

export type GraduateCandidateRow = {
  ref_no: string;
  student_no: string;
  fullname: string | null;
  gender: string | null;
  college_code: string | null;
  program_code: string | null;
  date_graduated: string | null;
  honor: string | null;
  remarks: string | null;
  billing_no: string | null;
  template_used: string | null;
  validating_officer_id: string | null;
  validation_date: string | null;
  or_no: string | null;
};

export type GraduateCandidatesPayload = {
  term_label: string;
  campus_name: string;
  expand_groups: boolean;
  groups: { college_code: string; gender: string; rows: GraduateCandidateRow[] }[];
  rows: GraduateCandidateRow[];
};

function refNo(id: number): string {
  return `REF-${String(id).padStart(6, "0")}`;
}

function formatDate(d: unknown): string | null {
  if (d == null) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  const s = String(d);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function deriveHonor(qualified: string | null, gwa: unknown): string | null {
  const q = (qualified ?? "").trim().toUpperCase();
  if (q === "Y") {
    const g = gwa == null ? NaN : Number(gwa);
    if (Number.isFinite(g) && g <= 1.5) return "With honors";
    return "Qualified";
  }
  return null;
}

function genderLabel(raw: string | null): string | null {
  const g = (raw ?? "").trim().toUpperCase();
  if (g === "M") return "Male";
  if (g === "F") return "Female";
  return raw?.trim() || null;
}

export async function listGraduateCandidates(params: {
  academicYearTermId: number;
  campusId: number;
  collegeCode?: string;
  program?: string;
  expandGroups?: boolean;
}): Promise<GraduateCandidatesPayload> {
  await ensureColumns();

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

  let sql = `
    SELECT t.*, s.qualified, s.gwa
    FROM ${T_TAG} t
    LEFT JOIN ${T_SUMMARY} s
      ON s.academic_year_term_id = t.academic_year_term_id
      AND s.campus_id = t.campus_id
      AND UPPER(TRIM(s.student_no)) = UPPER(TRIM(t.student_no))
    WHERE t.academic_year_term_id = $1 AND t.campus_id = $2 AND t.voided = FALSE
  `;
  const qparams: Array<number | string> = [params.academicYearTermId, params.campusId];
  let idx = 3;

  const cc = (params.collegeCode ?? "").trim();
  if (cc && !/^all$/i.test(cc)) {
    sql += ` AND UPPER(TRIM(t.college_code)) = UPPER(TRIM($${idx}))`;
    qparams.push(cc);
    idx += 1;
  }

  const prog = (params.program ?? "").trim();
  if (prog && !/^all$/i.test(prog)) {
    sql += ` AND COALESCE(t.program_code, '') ILIKE $${idx}`;
    qparams.push(`%${prog}%`);
    idx += 1;
  }

  sql += ` ORDER BY t.college_code NULLS LAST, t.student_name NULLS LAST, t.student_no ASC`;

  const { rows } = await pool.query(sql, qparams);

  const list: GraduateCandidateRow[] = rows.map((row) => {
    const r = row as Record<string, unknown>;
    const id = Number(r.id);
    const tagGender = r.gender == null ? null : String(r.gender);
    const tagHonor = r.honor == null ? null : String(r.honor);
    const qualified = r.qualified == null ? null : String(r.qualified);
    return {
      ref_no: refNo(id),
      student_no: String(r.student_no),
      fullname: r.student_name == null ? null : String(r.student_name),
      gender: genderLabel(tagGender),
      college_code: r.college_code == null ? null : String(r.college_code),
      program_code: r.program_code == null ? null : String(r.program_code),
      date_graduated: formatDate(r.date_graduated),
      honor: tagHonor?.trim() || deriveHonor(qualified, r.gwa),
      remarks: r.remarks == null ? null : String(r.remarks),
      billing_no: r.billing_no == null ? null : String(r.billing_no),
      template_used: r.graduation_fee_template == null ? null : String(r.graduation_fee_template),
      validating_officer_id: r.validating_officer_id == null ? null : String(r.validating_officer_id),
      validation_date: formatDate(r.validation_date),
      or_no: r.or_no == null ? null : String(r.or_no),
    };
  });

  const expandGroups = Boolean(params.expandGroups);
  if (!expandGroups) {
    return {
      term_label: termLabel,
      campus_name: campusName,
      expand_groups: false,
      groups: [],
      rows: list,
    };
  }

  const groupMap = new Map<string, GraduateCandidateRow[]>();
  for (const row of list) {
    const college = (row.college_code ?? "").trim() || "—";
    const gender = (row.gender ?? "").trim() || "—";
    const key = `${college}|${gender}`;
    const bucket = groupMap.get(key) ?? [];
    bucket.push(row);
    groupMap.set(key, bucket);
  }

  const groups = [...groupMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupRows]) => {
      const [college_code, gender] = key.split("|");
      return { college_code, gender, rows: groupRows };
    });

  return {
    term_label: termLabel,
    campus_name: campusName,
    expand_groups: true,
    groups,
    rows: list,
  };
}
