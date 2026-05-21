import pool from "../db.js";

const T = "grade_sheet_inventory";

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      campus VARCHAR(200) NOT NULL DEFAULT '',
      subject_code VARCHAR(64),
      subject_title VARCHAR(300),
      section VARCHAR(64),
      identifier VARCHAR(120),
      sheet_status VARCHAR(40) NOT NULL DEFAULT 'available',
      sort_order INT NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_grade_sheet_inventory_term_campus ON ${T} (academic_year_term_id, campus)`
  );
};

export type GradeSheetInventoryRow = {
  id: number;
  academic_year_term_id: number;
  campus: string | null;
  subject_code: string | null;
  subject_title: string | null;
  section: string | null;
  identifier: string | null;
  sheet_status: string | null;
  sort_order: number;
  notes: string | null;
};

function mapRow(r: Record<string, unknown>): GradeSheetInventoryRow {
  return {
    id: Number(r.id),
    academic_year_term_id: Number(r.academic_year_term_id),
    campus: r.campus == null ? null : String(r.campus),
    subject_code: r.subject_code == null ? null : String(r.subject_code),
    subject_title: r.subject_title == null ? null : String(r.subject_title),
    section: r.section == null ? null : String(r.section),
    identifier: r.identifier == null ? null : String(r.identifier),
    sheet_status: r.sheet_status == null ? null : String(r.sheet_status),
    sort_order: Number(r.sort_order ?? 0),
    notes: r.notes == null ? null : String(r.notes),
  };
}

export async function listGradeSheetInventory(
  academicYearTermId: number,
  campus: string,
  view: string,
  subjectCode: string,
  section: string
): Promise<GradeSheetInventoryRow[]> {
  await ensureTable();
  const params: Array<string | number> = [academicYearTermId, campus.trim()];
  let q = `
    SELECT * FROM ${T}
    WHERE academic_year_term_id = $1 AND campus = $2
  `;
  let p = 3;
  const v = (view ?? "all").toLowerCase();
  if (v === "available") {
    q += ` AND LOWER(COALESCE(sheet_status, '')) = 'available'`;
  }
  const sc = subjectCode.trim();
  if (sc) {
    q += ` AND subject_code ILIKE $${p}`;
    params.push(`%${sc}%`);
    p++;
  }
  const sec = section.trim();
  if (sec) {
    q += ` AND section ILIKE $${p}`;
    params.push(`%${sec}%`);
    p++;
  }
  q += ` ORDER BY sort_order ASC, id ASC`;
  const { rows } = await pool.query(q, params);
  return rows.map((row) => mapRow(row as Record<string, unknown>));
}

export type GradeSheetInventoryInput = {
  subject_code?: string | null;
  subject_title?: string | null;
  section?: string | null;
  identifier?: string | null;
  sheet_status?: string | null;
  sort_order?: number | null;
  notes?: string | null;
};

export async function replaceGradeSheetInventory(
  academicYearTermId: number,
  campus: string,
  rows: GradeSheetInventoryInput[]
): Promise<GradeSheetInventoryRow[]> {
  await ensureTable();
  const c = campus.trim();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${T} WHERE academic_year_term_id = $1 AND campus = $2`, [
      academicYearTermId,
      c,
    ]);
    let order = 0;
    for (const r of rows) {
      await client.query(
        `
        INSERT INTO ${T} (
          academic_year_term_id, campus, subject_code, subject_title, section,
          identifier, sheet_status, sort_order, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          academicYearTermId,
          c,
          (r.subject_code ?? "").toString().slice(0, 64) || null,
          (r.subject_title ?? "").toString().slice(0, 300) || null,
          (r.section ?? "").toString().slice(0, 64) || null,
          (r.identifier ?? "").toString().slice(0, 120) || null,
          (r.sheet_status ?? "available").toString().slice(0, 40) || "available",
          Number(r.sort_order ?? order) || order,
          r.notes == null || r.notes === "" ? null : String(r.notes).slice(0, 2000),
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
  return listGradeSheetInventory(academicYearTermId, c, "all", "", "");
}
