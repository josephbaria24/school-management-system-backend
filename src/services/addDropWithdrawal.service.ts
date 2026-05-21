import pool from "../db.js";

const T_TX = "add_drop_transaction_list";
const T_WD = "add_drop_withdrawn_list";
const T_SC = "add_drop_schedule_line";
const T_ST = "add_drop_staging_line";

const ensureTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_TX} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      trans_date DATE,
      reg_id VARCHAR(80),
      student_no VARCHAR(64),
      student_name VARCHAR(240),
      facilitator VARCHAR(200),
      assessed_date DATE,
      assessed_by VARCHAR(200),
      email VARCHAR(200),
      classification VARCHAR(120),
      inactive VARCHAR(40),
      classid VARCHAR(100),
      indexid VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_WD} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      trans_date DATE,
      reg_id VARCHAR(80),
      student_no VARCHAR(64),
      full_name VARCHAR(240),
      facilitator VARCHAR(200),
      assessed_date DATE,
      assessed_by VARCHAR(200),
      or_nbr VARCHAR(80),
      validation_date DATE,
      casher VARCHAR(120),
      total_net_assessed NUMERIC(14,2),
      total_payment NUMERIC(14,2),
      total_discount NUMERIC(14,2),
      withdrawn_by VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_SC} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      student_no VARCHAR(64) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      sched_id VARCHAR(80),
      subject_code VARCHAR(64),
      subject_title VARCHAR(300),
      section VARCHAR(64),
      units VARCHAR(32),
      lab VARCHAR(32),
      schedule_1 VARCHAR(120),
      room_1 VARCHAR(120),
      schedule_2 VARCHAR(120),
      room_2 VARCHAR(120),
      schedule_3 VARCHAR(120),
      room_3 VARCHAR(120),
      schedule_4 VARCHAR(120),
      room_4 VARCHAR(120),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_add_drop_schedule_term_student ON ${T_SC} (academic_year_term_id, student_no)`
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T_ST} (
      id SERIAL PRIMARY KEY,
      academic_year_term_id INT NOT NULL,
      student_no VARCHAR(64) NOT NULL,
      transaction_code VARCHAR(64) NOT NULL DEFAULT '00000000',
      sort_order INT NOT NULL DEFAULT 0,
      sched_id VARCHAR(80),
      rev_type VARCHAR(80),
      subject_code VARCHAR(64),
      subject_title VARCHAR(300),
      section VARCHAR(64),
      units VARCHAR(32),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_add_drop_staging_lookup ON ${T_ST} (academic_year_term_id, student_no, transaction_code)`
  );
};

export type AddDropTransactionRow = {
  id: number;
  academic_year_term_id: number;
  trans_date: string | null;
  reg_id: string | null;
  student_no: string | null;
  student_name: string | null;
  facilitator: string | null;
  assessed_date: string | null;
  assessed_by: string | null;
  email: string | null;
  classification: string | null;
  inactive: string | null;
  classid: string | null;
  indexid: string | null;
};

export type AddDropWithdrawnRow = {
  id: number;
  academic_year_term_id: number;
  trans_date: string | null;
  reg_id: string | null;
  student_no: string | null;
  full_name: string | null;
  facilitator: string | null;
  assessed_date: string | null;
  assessed_by: string | null;
  or_nbr: string | null;
  validation_date: string | null;
  casher: string | null;
  total_net_assessed: string | null;
  total_payment: string | null;
  total_discount: string | null;
  withdrawn_by: string | null;
};

export type AddDropScheduleRow = {
  id: number;
  academic_year_term_id: number;
  student_no: string;
  sort_order: number;
  sched_id: string | null;
  subject_code: string | null;
  subject_title: string | null;
  section: string | null;
  units: string | null;
  lab: string | null;
  schedule_1: string | null;
  room_1: string | null;
  schedule_2: string | null;
  room_2: string | null;
  schedule_3: string | null;
  room_3: string | null;
  schedule_4: string | null;
  room_4: string | null;
};

export type AddDropStagingRow = {
  id: number;
  academic_year_term_id: number;
  student_no: string;
  transaction_code: string;
  sort_order: number;
  sched_id: string | null;
  rev_type: string | null;
  subject_code: string | null;
  subject_title: string | null;
  section: string | null;
  units: string | null;
};

const numStr = (v: unknown) => (v == null ? null : String(v));

export const listAddDropTransactions = async (termId: number): Promise<AddDropTransactionRow[]> => {
  await ensureTables();
  const r = await pool.query(
    `SELECT * FROM ${T_TX} WHERE academic_year_term_id = $1 ORDER BY id DESC`,
    [termId]
  );
  return r.rows as AddDropTransactionRow[];
};

export const listAddDropWithdrawn = async (termId: number): Promise<AddDropWithdrawnRow[]> => {
  await ensureTables();
  const r = await pool.query(
    `SELECT * FROM ${T_WD} WHERE academic_year_term_id = $1 ORDER BY id DESC`,
    [termId]
  );
  return (r.rows as any[]).map((row) => ({
    ...row,
    total_net_assessed: numStr(row.total_net_assessed),
    total_payment: numStr(row.total_payment),
    total_discount: numStr(row.total_discount),
  })) as AddDropWithdrawnRow[];
};

export const listScheduleLines = async (termId: number, studentNo: string): Promise<AddDropScheduleRow[]> => {
  await ensureTables();
  const r = await pool.query(
    `SELECT * FROM ${T_SC} WHERE academic_year_term_id = $1 AND student_no = $2 ORDER BY sort_order ASC, id ASC`,
    [termId, studentNo.trim()]
  );
  return r.rows as AddDropScheduleRow[];
};

export const listStagingLines = async (
  termId: number,
  studentNo: string,
  transactionCode: string
): Promise<AddDropStagingRow[]> => {
  await ensureTables();
  const r = await pool.query(
    `SELECT * FROM ${T_ST} WHERE academic_year_term_id = $1 AND student_no = $2 AND transaction_code = $3
     ORDER BY sort_order ASC, id ASC`,
    [termId, studentNo.trim(), (transactionCode || "00000000").trim()]
  );
  return r.rows as AddDropStagingRow[];
};

export type ScheduleLineInput = {
  sched_id?: string | null;
  subject_code?: string | null;
  subject_title?: string | null;
  section?: string | null;
  units?: string | null;
  lab?: string | null;
  schedule_1?: string | null;
  room_1?: string | null;
  schedule_2?: string | null;
  room_2?: string | null;
  schedule_3?: string | null;
  room_3?: string | null;
  schedule_4?: string | null;
  room_4?: string | null;
};

export const replaceScheduleLines = async (
  termId: number,
  studentNo: string,
  rows: ScheduleLineInput[]
) => {
  await ensureTables();
  const sn = studentNo.trim();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${T_SC} WHERE academic_year_term_id = $1 AND student_no = $2`, [termId, sn]);
    let order = 0;
    for (const row of rows) {
      await client.query(
        `INSERT INTO ${T_SC} (
          academic_year_term_id, student_no, sort_order,
          sched_id, subject_code, subject_title, section, units, lab,
          schedule_1, room_1, schedule_2, room_2, schedule_3, room_3, schedule_4, room_4
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          termId,
          sn,
          order++,
          row.sched_id ?? null,
          row.subject_code ?? null,
          row.subject_title ?? null,
          row.section ?? null,
          row.units ?? null,
          row.lab ?? null,
          row.schedule_1 ?? null,
          row.room_1 ?? null,
          row.schedule_2 ?? null,
          row.room_2 ?? null,
          row.schedule_3 ?? null,
          row.room_3 ?? null,
          row.schedule_4 ?? null,
          row.room_4 ?? null,
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
  return listScheduleLines(termId, sn);
};

export type StagingLineInput = {
  sched_id?: string | null;
  rev_type?: string | null;
  subject_code?: string | null;
  subject_title?: string | null;
  section?: string | null;
  units?: string | null;
};

export const replaceStagingLines = async (
  termId: number,
  studentNo: string,
  transactionCode: string,
  rows: StagingLineInput[]
) => {
  await ensureTables();
  const sn = studentNo.trim();
  const tc = (transactionCode || "00000000").trim();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM ${T_ST} WHERE academic_year_term_id = $1 AND student_no = $2 AND transaction_code = $3`,
      [termId, sn, tc]
    );
    let order = 0;
    for (const row of rows) {
      await client.query(
        `INSERT INTO ${T_ST} (
          academic_year_term_id, student_no, transaction_code, sort_order,
          sched_id, rev_type, subject_code, subject_title, section, units
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          termId,
          sn,
          tc,
          order++,
          row.sched_id ?? null,
          row.rev_type ?? null,
          row.subject_code ?? null,
          row.subject_title ?? null,
          row.section ?? null,
          row.units ?? null,
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
  return listStagingLines(termId, sn, tc);
};

export type TransactionInput = Partial<
  Omit<AddDropTransactionRow, "id" | "academic_year_term_id" | "created_at" | "updated_at">
>;

export const createTransaction = async (termId: number, data: TransactionInput) => {
  await ensureTables();
  const r = await pool.query(
    `INSERT INTO ${T_TX} (
      academic_year_term_id, trans_date, reg_id, student_no, student_name, facilitator,
      assessed_date, assessed_by, email, classification, inactive, classid, indexid
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      termId,
      data.trans_date ?? null,
      data.reg_id ?? null,
      data.student_no ?? null,
      data.student_name ?? null,
      data.facilitator ?? null,
      data.assessed_date ?? null,
      data.assessed_by ?? null,
      data.email ?? null,
      data.classification ?? null,
      data.inactive ?? null,
      data.classid ?? null,
      data.indexid ?? null,
    ]
  );
  return r.rows[0] as AddDropTransactionRow;
};

export const deleteTransaction = async (id: number) => {
  await ensureTables();
  await pool.query(`DELETE FROM ${T_TX} WHERE id = $1`, [id]);
};

export type WithdrawnInput = Partial<
  Omit<AddDropWithdrawnRow, "id" | "academic_year_term_id" | "created_at" | "updated_at">
> & {
  total_net_assessed?: string | number | null;
  total_payment?: string | number | null;
  total_discount?: string | number | null;
};

export const createWithdrawn = async (termId: number, data: WithdrawnInput) => {
  await ensureTables();
  const r = await pool.query(
    `INSERT INTO ${T_WD} (
      academic_year_term_id, trans_date, reg_id, student_no, full_name, facilitator,
      assessed_date, assessed_by, or_nbr, validation_date, casher,
      total_net_assessed, total_payment, total_discount, withdrawn_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [
      termId,
      data.trans_date ?? null,
      data.reg_id ?? null,
      data.student_no ?? null,
      data.full_name ?? null,
      data.facilitator ?? null,
      data.assessed_date ?? null,
      data.assessed_by ?? null,
      data.or_nbr ?? null,
      data.validation_date ?? null,
      data.casher ?? null,
      data.total_net_assessed ?? null,
      data.total_payment ?? null,
      data.total_discount ?? null,
      data.withdrawn_by ?? null,
    ]
  );
  return r.rows[0];
};

export const deleteWithdrawn = async (id: number) => {
  await ensureTables();
  await pool.query(`DELETE FROM ${T_WD} WHERE id = $1`, [id]);
};
