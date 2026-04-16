import pool from "../db.js";
import { ensureChedMajorDisciplinesTable } from "./chedMajorDisciplines.service.js";
import { ensureAcademicProgramsTable } from "./academicPrograms.service.js";

const ensureTable = async () => {
  await ensureChedMajorDisciplinesTable();
  await ensureAcademicProgramsTable();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS academic_program_major_disciplines (
      id SERIAL PRIMARY KEY,
      academic_program_id INTEGER NOT NULL REFERENCES academic_programs(id) ON DELETE CASCADE,
      ched_major_discipline_id INTEGER NOT NULL REFERENCES ched_major_disciplines(id) ON DELETE CASCADE,
      offer BOOLEAN DEFAULT TRUE,
      is_inactive BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (academic_program_id, ched_major_discipline_id)
    )
  `);
};

export const getLinksByProgram = async (programId: number) => {
  await ensureTable();
  const r = await pool.query(
    `
    SELECT l.*, d.major_code, d.major_discipline, g.group_description AS major_group_name
    FROM academic_program_major_disciplines l
    JOIN ched_major_disciplines d ON l.ched_major_discipline_id = d.id
    JOIN major_discipline_groups g ON d.major_group_id = g.id
    WHERE l.academic_program_id = $1
    ORDER BY d.major_code ASC
    `,
    [programId]
  );
  return r.rows;
};

export const createProgramMajorLink = async (data: {
  academic_program_id: number;
  ched_major_discipline_id: number;
  offer?: boolean;
  is_inactive?: boolean;
}) => {
  await ensureTable();
  const r = await pool.query(
    `INSERT INTO academic_program_major_disciplines
      (academic_program_id, ched_major_discipline_id, offer, is_inactive)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      data.academic_program_id,
      data.ched_major_discipline_id,
      data.offer !== false,
      !!data.is_inactive,
    ]
  );
  return r.rows[0];
};

export const updateProgramMajorLink = async (
  id: number,
  data: { offer: boolean; is_inactive: boolean }
) => {
  await ensureTable();
  const r = await pool.query(
    `UPDATE academic_program_major_disciplines SET
      offer = $1, is_inactive = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [data.offer, data.is_inactive, id]
  );
  return r.rows[0];
};

export const deleteProgramMajorLink = async (id: number) => {
  await ensureTable();
  const r = await pool.query(
    "DELETE FROM academic_program_major_disciplines WHERE id = $1 RETURNING *",
    [id]
  );
  return r.rows[0];
};
