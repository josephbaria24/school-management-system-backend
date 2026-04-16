import pool from "../db.js";

export const ensureMajorDisciplineGroupsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS major_discipline_groups (
      id SERIAL PRIMARY KEY,
      group_code VARCHAR(20) NOT NULL UNIQUE,
      group_description VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    INSERT INTO major_discipline_groups (group_code, group_description) VALUES
      ('0', 'General'),
      ('14', 'Education Science and Teacher Training'),
      ('18', 'Fine and Applied Arts'),
      ('22', 'Humanities'),
      ('26', 'Religion and Theology'),
      ('30', 'Social and Behavioral Sciences'),
      ('34', 'Business Administration and Related'),
      ('38', 'Law and Jurisprudence'),
      ('42', 'Natural Science'),
      ('46', 'Mathematics'),
      ('47', 'IT-Related Disciplines'),
      ('50', 'Medical and Allied'),
      ('52', 'Trade, Craft and Industrial'),
      ('54', 'Engineering and Tech'),
      ('58', 'Architecture and Town Planning'),
      ('62', 'Agriculture, Forestry, Fisheries'),
      ('66', 'Home Economics'),
      ('78', 'Service Trades'),
      ('84', 'Mass Communication and Documentation'),
      ('89', 'Other Disciplines'),
      ('90', 'Maritime'),
      ('91', 'Senior High School')
    ON CONFLICT (group_code) DO NOTHING
  `);
};

export const getAllMajorDisciplineGroups = async () => {
  await ensureMajorDisciplineGroupsTable();
  const r = await pool.query(
    "SELECT * FROM major_discipline_groups ORDER BY group_code ASC"
  );
  return r.rows;
};

export const createMajorDisciplineGroup = async (data: {
  group_code: string;
  group_description: string;
}) => {
  await ensureMajorDisciplineGroupsTable();
  const r = await pool.query(
    `INSERT INTO major_discipline_groups (group_code, group_description)
     VALUES ($1, $2) RETURNING *`,
    [data.group_code.trim(), data.group_description.trim()]
  );
  return r.rows[0];
};

export const updateMajorDisciplineGroup = async (
  id: number,
  data: { group_code: string; group_description: string }
) => {
  await ensureMajorDisciplineGroupsTable();
  const r = await pool.query(
    `UPDATE major_discipline_groups SET
      group_code = $1, group_description = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [data.group_code.trim(), data.group_description.trim(), id]
  );
  return r.rows[0];
};

export const deleteMajorDisciplineGroup = async (id: number) => {
  await ensureMajorDisciplineGroupsTable();
  const r = await pool.query(
    "DELETE FROM major_discipline_groups WHERE id = $1 RETURNING *",
    [id]
  );
  return r.rows[0];
};
