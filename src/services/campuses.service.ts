import pool from "../db.js";

export const getAllCampuses = async (institutionId?: number) => {
  let query = "SELECT * FROM campuses";
  const params: any[] = [];
  
  if (institutionId) {
    query += " WHERE institution_id = $1";
    params.push(institutionId);
  }
  
  query += " ORDER BY acronym ASC";
  const result = await pool.query(query, params);
  return result.rows;
};

export const getCampusById = async (id: number) => {
  const result = await pool.query("SELECT * FROM campuses WHERE id = $1", [id]);
  return result.rows[0];
};

export const createCampus = async (data: any) => {
  const query = `
    INSERT INTO campuses (
      institution_id, acronym, campus_name, short_name, short_name_by_site,
      registrar_office_name, registrar_name, registrar_title, registrar_applies_to_all,
      accounting_office_name, accountant_name, accountant_title, accounting_applies_to_all,
      cashier_office_name, cashier_name, cashier_title, cashier_applies_to_all,
      barangay, town_city, district_id, zip_code, province, region,
      mailing_address, email, website, telephone_no, fax_no
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
    ) RETURNING *
  `;
  const values = [
    data.institution_id, data.acronym, data.campus_name, data.short_name, data.short_name_by_site,
    data.registrar_office_name, data.registrar_name, data.registrar_title, data.registrar_applies_to_all || false,
    data.accounting_office_name, data.accountant_name, data.accountant_title, data.accounting_applies_to_all || false,
    data.cashier_office_name, data.cashier_name, data.cashier_title, data.cashier_applies_to_all || false,
    data.barangay, data.town_city, data.district_id, data.zip_code, data.province, data.region,
    data.mailing_address, data.email, data.website, data.telephone_no, data.fax_no
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateCampus = async (id: number, data: any) => {
  const query = `
    UPDATE campuses SET
      institution_id = $1, acronym = $2, campus_name = $3, short_name = $4, short_name_by_site = $5,
      registrar_office_name = $6, registrar_name = $7, registrar_title = $8, registrar_applies_to_all = $9,
      accounting_office_name = $10, accountant_name = $11, accountant_title = $12, accounting_applies_to_all = $13,
      cashier_office_name = $14, cashier_name = $15, cashier_title = $16, cashier_applies_to_all = $17,
      barangay = $18, town_city = $19, district_id = $20, zip_code = $21, province = $22, region = $23,
      mailing_address = $24, email = $25, website = $26, telephone_no = $27, fax_no = $28,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $29
    RETURNING *
  `;
  const values = [
    data.institution_id, data.acronym, data.campus_name, data.short_name, data.short_name_by_site,
    data.registrar_office_name, data.registrar_name, data.registrar_title, data.registrar_applies_to_all || false,
    data.accounting_office_name, data.accountant_name, data.accountant_title, data.accounting_applies_to_all || false,
    data.cashier_office_name, data.cashier_name, data.cashier_title, data.cashier_applies_to_all || false,
    data.barangay, data.town_city, data.district_id, data.zip_code, data.province, data.region,
    data.mailing_address, data.email, data.website, data.telephone_no, data.fax_no,
    id
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteCampus = async (id: number) => {
  const result = await pool.query("DELETE FROM campuses WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};
