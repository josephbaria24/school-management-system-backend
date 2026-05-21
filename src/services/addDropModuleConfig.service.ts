import pool from "../db.js";

const T = "add_drop_module_config";

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${T} (
      id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      default_academic_year_term_id INT,
      default_campus VARCHAR(200) NOT NULL DEFAULT 'PSU Narra',
      check_schedule_conflict BOOLEAN NOT NULL DEFAULT TRUE,
      check_prereq BOOLEAN NOT NULL DEFAULT FALSE,
      allow_inc_grade BOOLEAN NOT NULL DEFAULT FALSE,
      allow_overload BOOLEAN NOT NULL DEFAULT FALSE,
      allow_cross_enroll BOOLEAN NOT NULL DEFAULT TRUE,
      auto_hide_full_schedule BOOLEAN NOT NULL DEFAULT TRUE,
      print_assessment_after_save BOOLEAN NOT NULL DEFAULT TRUE,
      adc_charging_mode VARCHAR(40) NOT NULL DEFAULT 'no_charge',
      revision_amount VARCHAR(32) NOT NULL DEFAULT '0.00',
      charge_drop BOOLEAN NOT NULL DEFAULT TRUE,
      charge_add BOOLEAN NOT NULL DEFAULT TRUE,
      charge_change BOOLEAN NOT NULL DEFAULT TRUE,
      charge_reservation_fee BOOLEAN NOT NULL DEFAULT FALSE,
      charge_lab_fee BOOLEAN NOT NULL DEFAULT TRUE,
      charge_misc_fee BOOLEAN NOT NULL DEFAULT FALSE,
      tf_reg_lect_units BOOLEAN NOT NULL DEFAULT TRUE,
      lf_reg_lab_units BOOLEAN NOT NULL DEFAULT TRUE,
      tf_spl_reg_lect_units BOOLEAN NOT NULL DEFAULT TRUE,
      lf_spl_reg_lab_units BOOLEAN NOT NULL DEFAULT TRUE,
      internet_condition BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export type AddDropModuleConfigDTO = {
  defaultAcademicYearTermId: string;
  defaultCampus: string;
  checkScheduleConflict: boolean;
  checkPrereq: boolean;
  allowIncGrade: boolean;
  allowOverload: boolean;
  allowCrossEnroll: boolean;
  autoHideFullSchedule: boolean;
  printAssessmentAfterSave: boolean;
  adcChargingMode: string;
  revisionAmount: string;
  chargeDrop: boolean;
  chargeAdd: boolean;
  chargeChange: boolean;
  chargeReservationFee: boolean;
  chargeLabFee: boolean;
  chargeMiscFee: boolean;
  tfRegLectUnits: boolean;
  lfRegLabUnits: boolean;
  tfSplRegLectUnits: boolean;
  lfSplRegLabUnits: boolean;
  internetCondition: boolean;
};

function mapRow(r: Record<string, unknown>): AddDropModuleConfigDTO {
  const tid = r.default_academic_year_term_id;
  return {
    defaultAcademicYearTermId: tid == null ? "" : String(tid),
    defaultCampus: String(r.default_campus ?? "PSU Narra"),
    checkScheduleConflict: Boolean(r.check_schedule_conflict),
    checkPrereq: Boolean(r.check_prereq),
    allowIncGrade: Boolean(r.allow_inc_grade),
    allowOverload: Boolean(r.allow_overload),
    allowCrossEnroll: Boolean(r.allow_cross_enroll),
    autoHideFullSchedule: Boolean(r.auto_hide_full_schedule),
    printAssessmentAfterSave: Boolean(r.print_assessment_after_save),
    adcChargingMode: String(r.adc_charging_mode ?? "no_charge"),
    revisionAmount: String(r.revision_amount ?? "0.00"),
    chargeDrop: Boolean(r.charge_drop),
    chargeAdd: Boolean(r.charge_add),
    chargeChange: Boolean(r.charge_change),
    chargeReservationFee: Boolean(r.charge_reservation_fee),
    chargeLabFee: Boolean(r.charge_lab_fee),
    chargeMiscFee: Boolean(r.charge_misc_fee),
    tfRegLectUnits: Boolean(r.tf_reg_lect_units),
    lfRegLabUnits: Boolean(r.lf_reg_lab_units),
    tfSplRegLectUnits: Boolean(r.tf_spl_reg_lect_units),
    lfSplRegLabUnits: Boolean(r.lf_spl_reg_lab_units),
    internetCondition: Boolean(r.internet_condition),
  };
}

const ADC_MODES = new Set(["no_charge", "charge_once", "charge_per_subject", "charge_per_transactions"]);

function normalizeInput(body: Record<string, unknown>): AddDropModuleConfigDTO {
  const mode = String(body.adcChargingMode ?? body.adc_charging_mode ?? "no_charge");
  const adcChargingMode = ADC_MODES.has(mode) ? mode : "no_charge";
  const termRaw = body.defaultAcademicYearTermId ?? body.default_academic_year_term_id;
  let defaultAcademicYearTermId = "";
  if (termRaw != null && String(termRaw).trim() !== "") {
    const n = parseInt(String(termRaw), 10);
    if (Number.isFinite(n) && n > 0) defaultAcademicYearTermId = String(n);
  }

  return {
    defaultAcademicYearTermId,
    defaultCampus: String(body.defaultCampus ?? body.default_campus ?? "PSU Narra").slice(0, 200),
    checkScheduleConflict: Boolean(body.checkScheduleConflict ?? body.check_schedule_conflict ?? true),
    checkPrereq: Boolean(body.checkPrereq ?? body.check_prereq),
    allowIncGrade: Boolean(body.allowIncGrade ?? body.allow_inc_grade),
    allowOverload: Boolean(body.allowOverload ?? body.allow_overload),
    allowCrossEnroll: Boolean(body.allowCrossEnroll ?? body.allow_cross_enroll ?? true),
    autoHideFullSchedule: Boolean(body.autoHideFullSchedule ?? body.auto_hide_full_schedule ?? true),
    printAssessmentAfterSave: Boolean(body.printAssessmentAfterSave ?? body.print_assessment_after_save ?? true),
    adcChargingMode,
    revisionAmount: String(body.revisionAmount ?? body.revision_amount ?? "0.00").slice(0, 32),
    chargeDrop: Boolean(body.chargeDrop ?? body.charge_drop ?? true),
    chargeAdd: Boolean(body.chargeAdd ?? body.charge_add ?? true),
    chargeChange: Boolean(body.chargeChange ?? body.charge_change ?? true),
    chargeReservationFee: Boolean(body.chargeReservationFee ?? body.charge_reservation_fee),
    chargeLabFee: Boolean(body.chargeLabFee ?? body.charge_lab_fee ?? true),
    chargeMiscFee: Boolean(body.chargeMiscFee ?? body.charge_misc_fee),
    tfRegLectUnits: Boolean(body.tfRegLectUnits ?? body.tf_reg_lect_units ?? true),
    lfRegLabUnits: Boolean(body.lfRegLabUnits ?? body.lf_reg_lab_units ?? true),
    tfSplRegLectUnits: Boolean(body.tfSplRegLectUnits ?? body.tf_spl_reg_lect_units ?? true),
    lfSplRegLabUnits: Boolean(body.lfSplRegLabUnits ?? body.lf_spl_reg_lab_units ?? true),
    internetCondition: Boolean(body.internetCondition ?? body.internet_condition ?? true),
  };
}

export async function getAddDropModuleConfig(): Promise<AddDropModuleConfigDTO> {
  await ensureTable();
  const { rows } = await pool.query(`SELECT * FROM ${T} WHERE id = 1`);
  if (rows.length === 0) {
    await pool.query(`INSERT INTO ${T} (id) VALUES (1)`);
    const again = await pool.query(`SELECT * FROM ${T} WHERE id = 1`);
    return mapRow(again.rows[0] as Record<string, unknown>);
  }
  return mapRow(rows[0] as Record<string, unknown>);
}

export async function saveAddDropModuleConfig(body: Record<string, unknown>): Promise<AddDropModuleConfigDTO> {
  await ensureTable();
  const c = normalizeInput(body);
  const termId =
    c.defaultAcademicYearTermId === "" ? null : parseInt(c.defaultAcademicYearTermId, 10) || null;

  await pool.query(
    `
    INSERT INTO ${T} (
      id,
      default_academic_year_term_id,
      default_campus,
      check_schedule_conflict,
      check_prereq,
      allow_inc_grade,
      allow_overload,
      allow_cross_enroll,
      auto_hide_full_schedule,
      print_assessment_after_save,
      adc_charging_mode,
      revision_amount,
      charge_drop,
      charge_add,
      charge_change,
      charge_reservation_fee,
      charge_lab_fee,
      charge_misc_fee,
      tf_reg_lect_units,
      lf_reg_lab_units,
      tf_spl_reg_lect_units,
      lf_spl_reg_lab_units,
      internet_condition
    ) VALUES (
      1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    )
    ON CONFLICT (id) DO UPDATE SET
      default_academic_year_term_id = EXCLUDED.default_academic_year_term_id,
      default_campus = EXCLUDED.default_campus,
      check_schedule_conflict = EXCLUDED.check_schedule_conflict,
      check_prereq = EXCLUDED.check_prereq,
      allow_inc_grade = EXCLUDED.allow_inc_grade,
      allow_overload = EXCLUDED.allow_overload,
      allow_cross_enroll = EXCLUDED.allow_cross_enroll,
      auto_hide_full_schedule = EXCLUDED.auto_hide_full_schedule,
      print_assessment_after_save = EXCLUDED.print_assessment_after_save,
      adc_charging_mode = EXCLUDED.adc_charging_mode,
      revision_amount = EXCLUDED.revision_amount,
      charge_drop = EXCLUDED.charge_drop,
      charge_add = EXCLUDED.charge_add,
      charge_change = EXCLUDED.charge_change,
      charge_reservation_fee = EXCLUDED.charge_reservation_fee,
      charge_lab_fee = EXCLUDED.charge_lab_fee,
      charge_misc_fee = EXCLUDED.charge_misc_fee,
      tf_reg_lect_units = EXCLUDED.tf_reg_lect_units,
      lf_reg_lab_units = EXCLUDED.lf_reg_lab_units,
      tf_spl_reg_lect_units = EXCLUDED.tf_spl_reg_lect_units,
      lf_spl_reg_lab_units = EXCLUDED.lf_spl_reg_lab_units,
      internet_condition = EXCLUDED.internet_condition,
      updated_at = CURRENT_TIMESTAMP
    `,
    [
      termId,
      c.defaultCampus,
      c.checkScheduleConflict,
      c.checkPrereq,
      c.allowIncGrade,
      c.allowOverload,
      c.allowCrossEnroll,
      c.autoHideFullSchedule,
      c.printAssessmentAfterSave,
      c.adcChargingMode,
      c.revisionAmount,
      c.chargeDrop,
      c.chargeAdd,
      c.chargeChange,
      c.chargeReservationFee,
      c.chargeLabFee,
      c.chargeMiscFee,
      c.tfRegLectUnits,
      c.lfRegLabUnits,
      c.tfSplRegLectUnits,
      c.lfSplRegLabUnits,
      c.internetCondition,
    ]
  );

  return getAddDropModuleConfig();
}
