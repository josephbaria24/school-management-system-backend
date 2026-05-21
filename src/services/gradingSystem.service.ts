import pool from "../db.js";

const TABLE = "grading_system_rows";

export type GradingSystemDbRow = {
  id: number;
  grade_level: string;
  format_key: string;
  sort_order: number;
  grade_point: string;
  equivalence: string;
  letter_grade: string;
  description: string;
  remarks: string;
  disqualify_scholarship: boolean;
  hide_faculty_encoding: boolean;
  grades_following_periods: boolean;
  hide_evaluation: boolean;
  hide_report_grade: boolean;
  credit_unit: boolean;
  compute_gwa: boolean;
  hide_final: boolean;
  hide_midterm: boolean;
  grades_other_school: boolean;
  grade_applies_for: string;
};

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      grade_level VARCHAR(40) NOT NULL,
      format_key VARCHAR(20) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      grade_point VARCHAR(60) NOT NULL DEFAULT '',
      equivalence VARCHAR(500) NOT NULL DEFAULT '',
      letter_grade VARCHAR(80) NOT NULL DEFAULT '',
      description VARCHAR(500) NOT NULL DEFAULT '',
      remarks VARCHAR(500) NOT NULL DEFAULT '',
      disqualify_scholarship BOOLEAN NOT NULL DEFAULT FALSE,
      hide_faculty_encoding BOOLEAN NOT NULL DEFAULT FALSE,
      grades_following_periods BOOLEAN NOT NULL DEFAULT FALSE,
      hide_evaluation BOOLEAN NOT NULL DEFAULT FALSE,
      hide_report_grade BOOLEAN NOT NULL DEFAULT FALSE,
      credit_unit BOOLEAN NOT NULL DEFAULT FALSE,
      compute_gwa BOOLEAN NOT NULL DEFAULT FALSE,
      hide_final BOOLEAN NOT NULL DEFAULT FALSE,
      hide_midterm BOOLEAN NOT NULL DEFAULT FALSE,
      grades_other_school BOOLEAN NOT NULL DEFAULT FALSE,
      grade_applies_for VARCHAR(80) NOT NULL DEFAULT 'GENERAL',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_grading_system_level_format ON ${TABLE} (grade_level, format_key)`);
};

type SeedRow = Omit<GradingSystemDbRow, "id" | "created_at" | "updated_at">;

const defaultSeedFor = (gradeLevel: string, formatKey: string): SeedRow[] => {
  const mk = (sort: number, r: Omit<SeedRow, "grade_level" | "format_key" | "sort_order">): SeedRow => ({
    grade_level: gradeLevel,
    format_key: formatKey,
    sort_order: sort,
    ...r,
  });
  return [
    mk(0, {
      grade_point: "1.00",
      equivalence: "95-97%",
      letter_grade: "RE",
      description: "Re-enrolled",
      remarks: "RE-ENROLLED",
      disqualify_scholarship: false,
      hide_faculty_encoding: false,
      grades_following_periods: false,
      hide_evaluation: false,
      hide_report_grade: false,
      credit_unit: false,
      compute_gwa: false,
      hide_final: false,
      hide_midterm: false,
      grades_other_school: false,
      grade_applies_for: "GENERAL",
    }),
    mk(1, {
      grade_point: "2.50",
      equivalence: "80-82%",
      letter_grade: "S",
      description: "Satisfactory",
      remarks: "Passed",
      disqualify_scholarship: false,
      hide_faculty_encoding: false,
      grades_following_periods: true,
      hide_evaluation: false,
      hide_report_grade: false,
      credit_unit: true,
      compute_gwa: true,
      hide_final: false,
      hide_midterm: false,
      grades_other_school: false,
      grade_applies_for: "GENERAL",
    }),
    mk(2, {
      grade_point: "3.00",
      equivalence: "86-88%",
      letter_grade: "E",
      description: "Excellent",
      remarks: "Passed",
      disqualify_scholarship: false,
      hide_faculty_encoding: false,
      grades_following_periods: true,
      hide_evaluation: false,
      hide_report_grade: false,
      credit_unit: true,
      compute_gwa: true,
      hide_final: false,
      hide_midterm: false,
      grades_other_school: false,
      grade_applies_for: "GENERAL",
    }),
    mk(3, {
      grade_point: "4.00",
      equivalence: "Conditional Failure",
      letter_grade: "FNC",
      description: "Conditional Failure",
      remarks: "Conditional Failure",
      disqualify_scholarship: false,
      hide_faculty_encoding: false,
      grades_following_periods: false,
      hide_evaluation: false,
      hide_report_grade: false,
      credit_unit: false,
      compute_gwa: true,
      hide_final: false,
      hide_midterm: false,
      grades_other_school: false,
      grade_applies_for: "GENERAL",
    }),
    mk(4, {
      grade_point: "INC",
      equivalence: "Incomplete",
      letter_grade: "INC",
      description: "Incomplete",
      remarks: "Incomplete",
      disqualify_scholarship: true,
      hide_faculty_encoding: false,
      grades_following_periods: false,
      hide_evaluation: false,
      hide_report_grade: false,
      credit_unit: false,
      compute_gwa: false,
      hide_final: true,
      hide_midterm: false,
      grades_other_school: false,
      grade_applies_for: "GENERAL",
    }),
  ];
};

const seedIfEmpty = async (gradeLevel: string, formatKey: string) => {
  const c = await pool.query(
    `SELECT COUNT(*)::int AS n FROM ${TABLE} WHERE grade_level = $1 AND format_key = $2`,
    [gradeLevel, formatKey]
  );
  if ((c.rows[0]?.n ?? 0) > 0) return;
  const seeds = defaultSeedFor(gradeLevel, formatKey);
  for (const s of seeds) {
    await pool.query(
      `INSERT INTO ${TABLE} (
        grade_level, format_key, sort_order, grade_point, equivalence, letter_grade, description, remarks,
        disqualify_scholarship, hide_faculty_encoding, grades_following_periods, hide_evaluation, hide_report_grade,
        credit_unit, compute_gwa, hide_final, hide_midterm, grades_other_school, grade_applies_for
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )`,
      [
        s.grade_level,
        s.format_key,
        s.sort_order,
        s.grade_point,
        s.equivalence,
        s.letter_grade,
        s.description,
        s.remarks,
        s.disqualify_scholarship,
        s.hide_faculty_encoding,
        s.grades_following_periods,
        s.hide_evaluation,
        s.hide_report_grade,
        s.credit_unit,
        s.compute_gwa,
        s.hide_final,
        s.hide_midterm,
        s.grades_other_school,
        s.grade_applies_for,
      ]
    );
  }
};

export const listGradingRows = async (gradeLevel: string, formatKey: string): Promise<GradingSystemDbRow[]> => {
  await ensureTable();
  await seedIfEmpty(gradeLevel, formatKey);
  const r = await pool.query(
    `SELECT * FROM ${TABLE} WHERE grade_level = $1 AND format_key = $2 ORDER BY sort_order ASC, id ASC`,
    [gradeLevel, formatKey]
  );
  return r.rows as GradingSystemDbRow[];
};

export type GradingRowInput = {
  grade_point: string;
  equivalence: string;
  letter_grade: string;
  description: string;
  remarks: string;
  disqualify_scholarship: boolean;
  hide_faculty_encoding: boolean;
  grades_following_periods: boolean;
  hide_evaluation: boolean;
  hide_report_grade: boolean;
  credit_unit: boolean;
  compute_gwa: boolean;
  hide_final: boolean;
  hide_midterm: boolean;
  grades_other_school: boolean;
  grade_applies_for: string;
};

export const replaceGradingRows = async (
  gradeLevel: string,
  formatKey: string,
  rows: GradingRowInput[]
) => {
  await ensureTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${TABLE} WHERE grade_level = $1 AND format_key = $2`, [gradeLevel, formatKey]);
    let order = 0;
    for (const row of rows) {
      await client.query(
        `INSERT INTO ${TABLE} (
          grade_level, format_key, sort_order, grade_point, equivalence, letter_grade, description, remarks,
          disqualify_scholarship, hide_faculty_encoding, grades_following_periods, hide_evaluation, hide_report_grade,
          credit_unit, compute_gwa, hide_final, hide_midterm, grades_other_school, grade_applies_for
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
        )`,
        [
          gradeLevel,
          formatKey,
          order++,
          row.grade_point ?? "",
          row.equivalence ?? "",
          row.letter_grade ?? "",
          row.description ?? "",
          row.remarks ?? "",
          !!row.disqualify_scholarship,
          !!row.hide_faculty_encoding,
          !!row.grades_following_periods,
          !!row.hide_evaluation,
          !!row.hide_report_grade,
          !!row.credit_unit,
          !!row.compute_gwa,
          !!row.hide_final,
          !!row.hide_midterm,
          !!row.grades_other_school,
          (row.grade_applies_for || "GENERAL").slice(0, 80),
        ]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return listGradingRows(gradeLevel, formatKey);
};
