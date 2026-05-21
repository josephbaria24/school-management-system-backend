import pool from "../db.js";

const TABLE = "scholastic_delinquency_rules";

export type ScholasticDelinquencyRow = {
  id: number;
  sort_order: number;
  min_units_enrolled: string;
  max_units_enrolled: string;
  min_percent_subject: string;
  max_percent_subject: string;
  status_text: string;
  less_to_allowable: string;
};

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      sort_order INT NOT NULL DEFAULT 0,
      min_units_enrolled NUMERIC(14,4) NOT NULL DEFAULT 0,
      max_units_enrolled NUMERIC(14,4) NOT NULL DEFAULT 0,
      min_percent_subject NUMERIC(14,4) NOT NULL DEFAULT 0,
      max_percent_subject NUMERIC(14,4) NOT NULL DEFAULT 0,
      status_text TEXT NOT NULL DEFAULT '',
      less_to_allowable NUMERIC(14,4) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const formatNum = (v: unknown) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
};

const seedDefaultsIfEmpty = async () => {
  const c = await pool.query(`SELECT COUNT(*)::int AS n FROM ${TABLE}`);
  const n = c.rows[0]?.n ?? 0;
  if (n > 0) return;
  const defaults: Array<[number, number, number, number, number, string, number]> = [
    [0, 0, 99, 25, 49, "Warning", 3],
    [1, 6, 99, 50, 75, "Probation", 15],
    [2, 9, 99, 76, 99, "Dismissal from the College", 0],
    [3, 9, 11, 20, 23, "Dismissal from the College", 0],
    [
      4,
      12,
      99,
      19,
      23,
      "Permanent Disqualification (Dismissal from the University)",
      0,
    ],
  ];
  for (const [sort, minU, maxU, minP, maxP, status, less] of defaults) {
    await pool.query(
      `INSERT INTO ${TABLE} (sort_order, min_units_enrolled, max_units_enrolled, min_percent_subject, max_percent_subject, status_text, less_to_allowable)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sort, minU, maxU, minP, maxP, status, less]
    );
  }
};

export const listScholasticDelinquencyRules = async (): Promise<ScholasticDelinquencyRow[]> => {
  await ensureTable();
  await seedDefaultsIfEmpty();
  const r = await pool.query(
    `SELECT id, sort_order,
            min_units_enrolled::text, max_units_enrolled::text,
            min_percent_subject::text, max_percent_subject::text,
            status_text, less_to_allowable::text
     FROM ${TABLE}
     ORDER BY sort_order ASC, id ASC`
  );
  return r.rows.map((row) => ({
    id: row.id,
    sort_order: row.sort_order,
    min_units_enrolled: formatNum(row.min_units_enrolled),
    max_units_enrolled: formatNum(row.max_units_enrolled),
    min_percent_subject: formatNum(row.min_percent_subject),
    max_percent_subject: formatNum(row.max_percent_subject),
    status_text: row.status_text ?? "",
    less_to_allowable: formatNum(row.less_to_allowable),
  }));
};

export type ScholasticDelinquencyInput = {
  min_units_enrolled: number | string;
  max_units_enrolled: number | string;
  min_percent_subject: number | string;
  max_percent_subject: number | string;
  status_text: string;
  less_to_allowable: number | string;
};

export const replaceScholasticDelinquencyRules = async (rows: ScholasticDelinquencyInput[]) => {
  await ensureTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${TABLE}`);
    let order = 0;
    for (const row of rows) {
      await client.query(
        `INSERT INTO ${TABLE} (sort_order, min_units_enrolled, max_units_enrolled, min_percent_subject, max_percent_subject, status_text, less_to_allowable)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order++,
          row.min_units_enrolled,
          row.max_units_enrolled,
          row.min_percent_subject,
          row.max_percent_subject,
          row.status_text ?? "",
          row.less_to_allowable,
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
  return listScholasticDelinquencyRules();
};
