import pool from "../db.js";

const ensureSchoolCalendarTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS school_calendar_events (
      id SERIAL PRIMARY KEY,
      calendar_date DATE NOT NULL,
      description TEXT,
      non_working_day BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getAllSchoolCalendarEvents = async (year?: number) => {
  await ensureSchoolCalendarTable();
  let query = "SELECT * FROM school_calendar_events";
  const params: number[] = [];
  if (year && Number.isFinite(year)) {
    query += " WHERE EXTRACT(YEAR FROM calendar_date)::int = $1";
    params.push(year);
  }
  query += " ORDER BY calendar_date ASC, id ASC";
  const result = await pool.query(query, params);
  return result.rows;
};

export const createSchoolCalendarEvent = async (data: {
  calendar_date: string;
  description?: string | null;
  non_working_day?: boolean;
}) => {
  await ensureSchoolCalendarTable();
  const q = `
    INSERT INTO school_calendar_events (calendar_date, description, non_working_day)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await pool.query(q, [
    data.calendar_date,
    data.description ?? null,
    !!data.non_working_day,
  ]);
  return result.rows[0];
};

export const updateSchoolCalendarEvent = async (
  id: number,
  data: {
    calendar_date: string;
    description?: string | null;
    non_working_day?: boolean;
  }
) => {
  await ensureSchoolCalendarTable();
  const q = `
    UPDATE school_calendar_events
    SET calendar_date = $1,
        description = $2,
        non_working_day = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
  `;
  const result = await pool.query(q, [
    data.calendar_date,
    data.description ?? null,
    !!data.non_working_day,
    id,
  ]);
  return result.rows[0];
};

export const deleteSchoolCalendarEvent = async (id: number) => {
  await ensureSchoolCalendarTable();
  const result = await pool.query(
    "DELETE FROM school_calendar_events WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};
