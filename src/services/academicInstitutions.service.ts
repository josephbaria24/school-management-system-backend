import pool from "../db.js";

const ensureInstitutionHeadsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS institution_heads (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const ensureInstitutionHeadTitlesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS institution_head_titles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getAllInstitutions = async () => {
  const query = `
    SELECT ai.*, ic.name as classification_name
    FROM academic_institutions ai
    LEFT JOIN institution_classifications ic ON ai.classification_id = ic.id
    ORDER BY ai.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const getInstitutionById = async (id: number) => {
  const query = `
    SELECT ai.*, ic.name as classification_name
    FROM academic_institutions ai
    LEFT JOIN institution_classifications ic ON ai.classification_id = ic.id
    WHERE ai.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createInstitution = async (data: any) => {
  const query = `
    INSERT INTO academic_institutions (
      official_name, classification_id, head_person_id, head_title,
      institution_unique_identifier, address_street, address_municipality,
      address_province_city, address_region, address_zip_code,
      telephone_no, fax_no, head_telephone, email_address, website,
      year_established, latest_sec_registration, date_granted_or_approved,
      year_converted_to_college, year_converted_to_university, logo_url
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
    ) RETURNING *
  `;
  const values = [
    data.official_name, data.classification_id, data.head_person_id, data.head_title,
    data.institution_unique_identifier, data.address_street, data.address_municipality,
    data.address_province_city, data.address_region, data.address_zip_code,
    data.telephone_no, data.fax_no, data.head_telephone, data.email_address, data.website,
    data.year_established, data.latest_sec_registration, data.date_granted_or_approved,
    data.year_converted_to_college, data.year_converted_to_university, data.logo_url
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateInstitution = async (id: number, data: any) => {
  const query = `
    UPDATE academic_institutions SET
      official_name = $1, classification_id = $2, head_person_id = $3, head_title = $4,
      institution_unique_identifier = $5, address_street = $6, address_municipality = $7,
      address_province_city = $8, address_region = $9, address_zip_code = $10,
      telephone_no = $11, fax_no = $12, head_telephone = $13, email_address = $14, website = $15,
      year_established = $16, latest_sec_registration = $17, date_granted_or_approved = $18,
      year_converted_to_college = $19, year_converted_to_university = $20, logo_url = $21,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $22
    RETURNING *
  `;
  const values = [
    data.official_name, data.classification_id, data.head_person_id, data.head_title,
    data.institution_unique_identifier, data.address_street, data.address_municipality,
    data.address_province_city, data.address_region, data.address_zip_code,
    data.telephone_no, data.fax_no, data.head_telephone, data.email_address, data.website,
    data.year_established, data.latest_sec_registration, data.date_granted_or_approved,
    data.year_converted_to_college, data.year_converted_to_university, data.logo_url,
    id
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteInstitution = async (id: number) => {
  const query = "DELETE FROM academic_institutions WHERE id = $1 RETURNING *";
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Classification service logic
export const getAllClassifications = async () => {
  const result = await pool.query("SELECT * FROM institution_classifications ORDER BY name ASC");
  return result.rows;
};

export const createClassification = async (name: string, description?: string) => {
  const query = `
    INSERT INTO institution_classifications (name, description)
    VALUES ($1, $2)
    RETURNING *
  `;
  const result = await pool.query(query, [name, description || null]);
  return result.rows[0];
};

export const updateClassification = async (id: number, name: string, description?: string) => {
  const query = `
    UPDATE institution_classifications
    SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  const result = await pool.query(query, [name, description || null, id]);
  return result.rows[0];
};

export const deleteClassification = async (id: number) => {
  const query = "DELETE FROM institution_classifications WHERE id = $1 RETURNING *";
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Institution Heads service logic
export const getAllInstitutionHeads = async () => {
  await ensureInstitutionHeadsTable();
  const result = await pool.query("SELECT * FROM institution_heads ORDER BY full_name ASC");
  return result.rows;
};

export const createInstitutionHead = async (fullName: string) => {
  await ensureInstitutionHeadsTable();
  const query = `
    INSERT INTO institution_heads (full_name)
    VALUES ($1)
    RETURNING *
  `;
  const result = await pool.query(query, [fullName]);
  return result.rows[0];
};

export const updateInstitutionHead = async (id: number, fullName: string) => {
  await ensureInstitutionHeadsTable();
  const query = `
    UPDATE institution_heads
    SET full_name = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [fullName, id]);
  return result.rows[0];
};

export const deleteInstitutionHead = async (id: number) => {
  await ensureInstitutionHeadsTable();
  const query = "DELETE FROM institution_heads WHERE id = $1 RETURNING *";
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Institution Head Titles service logic
export const getAllInstitutionHeadTitles = async () => {
  await ensureInstitutionHeadTitlesTable();
  await pool.query(`
    INSERT INTO institution_head_titles (name)
    VALUES
      ('Adm. Ast III'),
      ('President'),
      ('Chancellor'),
      ('Executive Director'),
      ('Dean'),
      ('Rector'),
      ('Head')
    ON CONFLICT (name) DO NOTHING
  `);
  const result = await pool.query("SELECT * FROM institution_head_titles ORDER BY name ASC");
  return result.rows;
};

export const createInstitutionHeadTitle = async (name: string) => {
  await ensureInstitutionHeadTitlesTable();
  const query = `
    INSERT INTO institution_head_titles (name)
    VALUES ($1)
    RETURNING *
  `;
  const result = await pool.query(query, [name]);
  return result.rows[0];
};

export const updateInstitutionHeadTitle = async (id: number, name: string) => {
  await ensureInstitutionHeadTitlesTable();
  const query = `
    UPDATE institution_head_titles
    SET name = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [name, id]);
  return result.rows[0];
};

export const deleteInstitutionHeadTitle = async (id: number) => {
  await ensureInstitutionHeadTitlesTable();
  const query = "DELETE FROM institution_head_titles WHERE id = $1 RETURNING *";
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
