import pool from "../db.js";

type ApplicantPayload = {
  controlledDraft?: {
    yearTermId?: string;
    choiceCampusIds?: string[];
    choiceProgramIds?: string[];
    choiceMajorValues?: string[];
  };
  inputDraft?: Record<string, string | boolean>;
};

const asText = (v: unknown): string => {
  if (v === undefined || v === null) return "";
  return String(v).trim();
};

const asInt = (v: unknown): number | null => {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};

const asFloat = (v: unknown): number | null => {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const getInputValue = (payload: ApplicantPayload, key: string) =>
  payload.inputDraft?.[`input::${key}`] ??
  payload.inputDraft?.[`textarea::${key}`] ??
  payload.inputDraft?.[`select::${key}`];

const parseAppDate = (raw: unknown): string | null => {
  const t = asText(raw);
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return `${t}T00:00:00Z`;
  const dt = new Date(t);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
};

export const ensureAdmissionApplicantProfilesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admission_applicants (
      app_no VARCHAR(15) PRIMARY KEY,
      app_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      term_id INTEGER,
      adm_status_id INTEGER NOT NULL DEFAULT 1,
      apply_type_id INTEGER,
      last_name VARCHAR(50) NOT NULL DEFAULT '',
      first_name VARCHAR(50) NOT NULL DEFAULT '',
      middle_name VARCHAR(50) NOT NULL DEFAULT '',
      middle_initial VARCHAR(5) NOT NULL DEFAULT '',
      ext_name VARCHAR(5) NOT NULL DEFAULT '',
      gender CHAR(1) NOT NULL DEFAULT '',
      date_of_birth TIMESTAMPTZ,
      place_of_birth VARCHAR(60) NOT NULL DEFAULT '',
      civil_status_id INTEGER,
      nationality_id INTEGER DEFAULT 1,
      tel_no VARCHAR(50) NOT NULL DEFAULT '',
      mobile_no VARCHAR(50) NOT NULL DEFAULT '',
      email VARCHAR(100) NOT NULL DEFAULT '',
      res_address VARCHAR(100) NOT NULL DEFAULT '',
      res_street VARCHAR(100) NOT NULL DEFAULT '',
      res_barangay VARCHAR(100) NOT NULL DEFAULT '',
      res_town_city VARCHAR(100) NOT NULL DEFAULT '',
      res_zip_code INTEGER,
      res_province VARCHAR(100) NOT NULL DEFAULT '',
      perm_address VARCHAR(100) NOT NULL DEFAULT '',
      perm_street VARCHAR(100) NOT NULL DEFAULT '',
      perm_barangay VARCHAR(100) NOT NULL DEFAULT '',
      perm_town_city VARCHAR(100) NOT NULL DEFAULT '',
      perm_zip_code INTEGER,
      perm_province VARCHAR(30) NOT NULL DEFAULT '',
      father VARCHAR(100) NOT NULL DEFAULT '',
      father_occupation VARCHAR(100) NOT NULL DEFAULT '',
      father_company VARCHAR(100) NOT NULL DEFAULT '',
      father_company_address VARCHAR(100) NOT NULL DEFAULT '',
      father_tel_no VARCHAR(60) NOT NULL DEFAULT '',
      father_email VARCHAR(60) NOT NULL DEFAULT '',
      mother VARCHAR(100) NOT NULL DEFAULT '',
      mother_occupation VARCHAR(100) NOT NULL DEFAULT '',
      mother_company VARCHAR(100) NOT NULL DEFAULT '',
      mother_company_address VARCHAR(100) NOT NULL DEFAULT '',
      mother_tel_no VARCHAR(60) NOT NULL DEFAULT '',
      mother_email VARCHAR(60) NOT NULL DEFAULT '',
      guardian VARCHAR(100) NOT NULL DEFAULT '',
      guardian_relationship VARCHAR(100) NOT NULL DEFAULT '',
      guardian_address VARCHAR(100) NOT NULL DEFAULT '',
      guardian_occupation VARCHAR(100) NOT NULL DEFAULT '',
      guardian_company VARCHAR(100) NOT NULL DEFAULT '',
      guardian_tel_no VARCHAR(60) NOT NULL DEFAULT '',
      guardian_email VARCHAR(100) NOT NULL DEFAULT '',
      emergency_contact VARCHAR(100) NOT NULL DEFAULT '',
      emergency_address VARCHAR(100) NOT NULL DEFAULT '',
      emergency_mobile_no VARCHAR(60) NOT NULL DEFAULT '',
      emergency_tel_no VARCHAR(60) NOT NULL DEFAULT '',
      elem_school VARCHAR(100) NOT NULL DEFAULT '',
      elem_address VARCHAR(100) NOT NULL DEFAULT '',
      elem_incl_dates VARCHAR(60) NOT NULL DEFAULT '',
      hs_school VARCHAR(100) NOT NULL DEFAULT '',
      hs_address VARCHAR(100) NOT NULL DEFAULT '',
      hs_incl_dates VARCHAR(60) NOT NULL DEFAULT '',
      vocational VARCHAR(100) NOT NULL DEFAULT '',
      vocational_address VARCHAR(100) NOT NULL DEFAULT '',
      vocational_degree VARCHAR(100) NOT NULL DEFAULT '',
      vocational_incl_dates VARCHAR(100) NOT NULL DEFAULT '',
      college_school VARCHAR(100) NOT NULL DEFAULT '',
      college_address VARCHAR(100) NOT NULL DEFAULT '',
      college_degree VARCHAR(100) NOT NULL DEFAULT '',
      college_incl_dates VARCHAR(60) NOT NULL DEFAULT '',
      gs_school VARCHAR(100) NOT NULL DEFAULT '',
      gs_address VARCHAR(100) NOT NULL DEFAULT '',
      gs_degree VARCHAR(100) NOT NULL DEFAULT '',
      gs_incl_dates VARCHAR(60) NOT NULL DEFAULT '',
      choice1_campus_id INTEGER DEFAULT 0,
      choice2_campus_id INTEGER,
      choice3_campus_id INTEGER NOT NULL DEFAULT 0,
      choice4_campus_id INTEGER NOT NULL DEFAULT 0,
      choice1_course INTEGER,
      choice1_course_major INTEGER,
      choice2_course INTEGER,
      choice2_course_major INTEGER,
      choice3_course INTEGER,
      choice3_course_major INTEGER,
      choice4_course INTEGER,
      choice4_course_major INTEGER,
      has_good_moral BOOLEAN NOT NULL DEFAULT false,
      has_passport_pic BOOLEAN NOT NULL DEFAULT false,
      has_form137 BOOLEAN NOT NULL DEFAULT false,
      has_transcript BOOLEAN NOT NULL DEFAULT false,
      has_birth_certificate BOOLEAN NOT NULL DEFAULT false,
      has_itr BOOLEAN NOT NULL DEFAULT false,
      has_scho_app BOOLEAN NOT NULL DEFAULT false,
      form137_gwa DOUBLE PRECISION,
      form137_math DOUBLE PRECISION,
      form137_science DOUBLE PRECISION,
      form137_english DOUBLE PRECISION,
      deny_reason VARCHAR(255) NOT NULL DEFAULT '',
      last_modified_date TIMESTAMPTZ,
      last_modified_by VARCHAR(15) NOT NULL DEFAULT '',
      has_medical_certificate BOOLEAN NOT NULL DEFAULT false,
      has_application_letter BOOLEAN NOT NULL DEFAULT false,
      has_recommendation_letter BOOLEAN NOT NULL DEFAULT false,
      religion_id INTEGER,
      reserve BOOLEAN DEFAULT false,
      has_baptismal_certificate BOOLEAN NOT NULL DEFAULT false,
      has_non_catholic_religion BOOLEAN NOT NULL DEFAULT false,
      has_ctc_report_card BOOLEAN NOT NULL DEFAULT false,
      has_passport_student_visa BOOLEAN NOT NULL DEFAULT false,
      has_acr BOOLEAN NOT NULL DEFAULT false,
      has_study_permit BOOLEAN NOT NULL DEFAULT false,
      testing_sched_id INTEGER NOT NULL DEFAULT 0,
      medical_sched_count INTEGER NOT NULL DEFAULT 0,
      testing_actual_date TIMESTAMPTZ,
      testing_sched_count INTEGER NOT NULL DEFAULT 0,
      exam_ref_no VARCHAR(20) NOT NULL DEFAULT '',
      exam_id INTEGER NOT NULL DEFAULT 0,
      medical_sched_id INTEGER NOT NULL DEFAULT 0,
      medical_sched_date TIMESTAMPTZ,
      fit_to_enroll INTEGER NOT NULL DEFAULT 0,
      medical_results VARCHAR(200) NOT NULL DEFAULT '',
      medical_signed_by VARCHAR(50) NOT NULL DEFAULT '',
      medical_signed_date TIMESTAMPTZ,
      reconsidered BOOLEAN NOT NULL DEFAULT false,
      reconsidered_date TIMESTAMPTZ,
      foreign_student BOOLEAN NOT NULL DEFAULT false,
      has_form138 BOOLEAN NOT NULL DEFAULT false,
      photo BYTEA,
      has_test_result BOOLEAN NOT NULL DEFAULT false,
      has_acc_app_form BOOLEAN NOT NULL DEFAULT false,
      has_health_exam_cert BOOLEAN NOT NULL DEFAULT false,
      has_self_stamped_mail_env BOOLEAN NOT NULL DEFAULT false,
      has_honorable_dismissal BOOLEAN NOT NULL DEFAULT false,
      ncae VARCHAR(50) NOT NULL DEFAULT '',
      final_prog_id INTEGER NOT NULL DEFAULT 0,
      final_major_id INTEGER NOT NULL DEFAULT 0,
      or_no VARCHAR(50) NOT NULL DEFAULT '',
      interview_rating VARCHAR(50) NOT NULL DEFAULT '',
      is_residence BOOLEAN NOT NULL DEFAULT false,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE admission_applicants
    ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb
  `);

  // One-time migration from the earlier simple JSON storage table.
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'admission_applicant_profiles'
      ) THEN
        INSERT INTO admission_applicants (app_no, payload, created_at, updated_at)
        SELECT
          LEFT(COALESCE(profile_key, 'applicant-profile'), 15),
          COALESCE(payload, '{}'::jsonb),
          COALESCE(created_at, CURRENT_TIMESTAMP),
          COALESCE(updated_at, CURRENT_TIMESTAMP)
        FROM admission_applicant_profiles
        ON CONFLICT (app_no)
        DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_at = CURRENT_TIMESTAMP;
      END IF;
    END$$;
  `);
};

export const getApplicantProfileByKey = async (profileKey: string) => {
  await ensureAdmissionApplicantProfilesTable();
  const r = await pool.query(
    `
    SELECT *
    FROM admission_applicants
    WHERE app_no = LEFT($1, 15)
    LIMIT 1
    `,
    [profileKey]
  );
  return r.rows[0] ?? null;
};

export const upsertApplicantProfileByKey = async (
  profileKey: string,
  payload: Record<string, unknown>
) => {
  await ensureAdmissionApplicantProfilesTable();
  const typed = payload as ApplicantPayload;
  const choicesCampus = typed.controlledDraft?.choiceCampusIds ?? [];
  const choicesCourse = typed.controlledDraft?.choiceProgramIds ?? [];
  const choicesMajor = typed.controlledDraft?.choiceMajorValues ?? [];

  const majorNames = choicesMajor
    .map((m) => asText(m))
    .filter((m) => m && m !== "__none__");
  const majorIdMap = new Map<string, number>();
  if (majorNames.length > 0) {
    const majorRows = await pool.query(
      `
      SELECT id, major_discipline
      FROM ched_major_disciplines
      WHERE TRIM(major_discipline) = ANY($1::text[])
      `,
      [majorNames]
    );
    majorRows.rows.forEach((r) => {
      majorIdMap.set(asText(r.major_discipline), Number(r.id));
    });
  }

  const choiceMajorId = (idx: number) => {
    const name = asText(choicesMajor[idx]);
    if (!name || name === "__none__") return null;
    return majorIdMap.get(name) ?? null;
  };

  const r = await pool.query(
    `
    INSERT INTO admission_applicants (
      app_no, app_date, term_id,
      last_name, first_name, middle_name, middle_initial, ext_name, gender,
      date_of_birth, place_of_birth, tel_no, mobile_no, email,
      res_address, res_street, res_barangay, res_town_city, res_zip_code, res_province,
      perm_address, perm_street, perm_barangay, perm_town_city, perm_zip_code, perm_province,
      father, father_occupation, father_company, father_company_address, father_tel_no, father_email,
      mother, mother_occupation, mother_company, mother_company_address, mother_tel_no, mother_email,
      guardian, guardian_relationship, guardian_address, guardian_occupation, guardian_company, guardian_tel_no, guardian_email,
      emergency_contact, emergency_address, emergency_mobile_no, emergency_tel_no,
      elem_school, elem_address, elem_incl_dates, hs_school, hs_address, hs_incl_dates,
      form137_gwa, form137_math, form137_science, form137_english,
      choice1_campus_id, choice2_campus_id, choice3_campus_id, choice4_campus_id,
      choice1_course, choice2_course, choice3_course, choice4_course,
      choice1_course_major, choice2_course_major, choice3_course_major, choice4_course_major,
      or_no, payload, created_at, updated_at
    )
    VALUES (
      LEFT($1, 15), COALESCE($2::timestamptz, CURRENT_TIMESTAMP), $3,
      $4,$5,$6,$7,$8,$9,
      $10,$11,$12,$13,$14,
      $15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,
      $27,$28,$29,$30,$31,$32,
      $33,$34,$35,$36,$37,$38,
      $39,$40,$41,$42,$43,$44,$45,
      $46,$47,$48,$49,
      $50,$51,$52,$53,$54,$55,
      $56,$57,$58,$59,
      $60,$61,$62,$63,
      $64,$65,$66,$67,
      $68,$69,$70,$71,
      $72,$73,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
    )
    ON CONFLICT (app_no)
    DO UPDATE SET
      app_date = EXCLUDED.app_date,
      term_id = EXCLUDED.term_id,
      last_name = EXCLUDED.last_name,
      first_name = EXCLUDED.first_name,
      middle_name = EXCLUDED.middle_name,
      middle_initial = EXCLUDED.middle_initial,
      ext_name = EXCLUDED.ext_name,
      gender = EXCLUDED.gender,
      date_of_birth = EXCLUDED.date_of_birth,
      place_of_birth = EXCLUDED.place_of_birth,
      tel_no = EXCLUDED.tel_no,
      mobile_no = EXCLUDED.mobile_no,
      email = EXCLUDED.email,
      res_address = EXCLUDED.res_address,
      res_street = EXCLUDED.res_street,
      res_barangay = EXCLUDED.res_barangay,
      res_town_city = EXCLUDED.res_town_city,
      res_zip_code = EXCLUDED.res_zip_code,
      res_province = EXCLUDED.res_province,
      perm_address = EXCLUDED.perm_address,
      perm_street = EXCLUDED.perm_street,
      perm_barangay = EXCLUDED.perm_barangay,
      perm_town_city = EXCLUDED.perm_town_city,
      perm_zip_code = EXCLUDED.perm_zip_code,
      perm_province = EXCLUDED.perm_province,
      father = EXCLUDED.father,
      father_occupation = EXCLUDED.father_occupation,
      father_company = EXCLUDED.father_company,
      father_company_address = EXCLUDED.father_company_address,
      father_tel_no = EXCLUDED.father_tel_no,
      father_email = EXCLUDED.father_email,
      mother = EXCLUDED.mother,
      mother_occupation = EXCLUDED.mother_occupation,
      mother_company = EXCLUDED.mother_company,
      mother_company_address = EXCLUDED.mother_company_address,
      mother_tel_no = EXCLUDED.mother_tel_no,
      mother_email = EXCLUDED.mother_email,
      guardian = EXCLUDED.guardian,
      guardian_relationship = EXCLUDED.guardian_relationship,
      guardian_address = EXCLUDED.guardian_address,
      guardian_occupation = EXCLUDED.guardian_occupation,
      guardian_company = EXCLUDED.guardian_company,
      guardian_tel_no = EXCLUDED.guardian_tel_no,
      guardian_email = EXCLUDED.guardian_email,
      emergency_contact = EXCLUDED.emergency_contact,
      emergency_address = EXCLUDED.emergency_address,
      emergency_mobile_no = EXCLUDED.emergency_mobile_no,
      emergency_tel_no = EXCLUDED.emergency_tel_no,
      elem_school = EXCLUDED.elem_school,
      elem_address = EXCLUDED.elem_address,
      elem_incl_dates = EXCLUDED.elem_incl_dates,
      hs_school = EXCLUDED.hs_school,
      hs_address = EXCLUDED.hs_address,
      hs_incl_dates = EXCLUDED.hs_incl_dates,
      form137_gwa = EXCLUDED.form137_gwa,
      form137_math = EXCLUDED.form137_math,
      form137_science = EXCLUDED.form137_science,
      form137_english = EXCLUDED.form137_english,
      choice1_campus_id = EXCLUDED.choice1_campus_id,
      choice2_campus_id = EXCLUDED.choice2_campus_id,
      choice3_campus_id = EXCLUDED.choice3_campus_id,
      choice4_campus_id = EXCLUDED.choice4_campus_id,
      choice1_course = EXCLUDED.choice1_course,
      choice2_course = EXCLUDED.choice2_course,
      choice3_course = EXCLUDED.choice3_course,
      choice4_course = EXCLUDED.choice4_course,
      choice1_course_major = EXCLUDED.choice1_course_major,
      choice2_course_major = EXCLUDED.choice2_course_major,
      choice3_course_major = EXCLUDED.choice3_course_major,
      choice4_course_major = EXCLUDED.choice4_course_major,
      or_no = EXCLUDED.or_no,
      payload = EXCLUDED.payload,
      last_modified_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    RETURNING app_no, payload, created_at, updated_at
    `,
    [
      profileKey,
      parseAppDate(getInputValue(typed, "app_date")),
      asInt(typed.controlledDraft?.yearTermId),
      asText(getInputValue(typed, "last_name")),
      asText(getInputValue(typed, "first_name")),
      asText(getInputValue(typed, "middle_name")),
      asText(getInputValue(typed, "middle_initial")),
      asText(getInputValue(typed, "ext_name")),
      asText(getInputValue(typed, "gender")).slice(0, 1),
      parseAppDate(getInputValue(typed, "date_of_birth")),
      asText(getInputValue(typed, "place_of_birth")),
      asText(getInputValue(typed, "tel_no")),
      asText(getInputValue(typed, "mobile_no")),
      asText(getInputValue(typed, "email")),
      asText(getInputValue(typed, "res_address")),
      asText(getInputValue(typed, "res_street")),
      asText(getInputValue(typed, "res_barangay")),
      asText(getInputValue(typed, "res_town_city")),
      asInt(getInputValue(typed, "res_zip_code")),
      asText(getInputValue(typed, "res_province")),
      asText(getInputValue(typed, "perm_address")),
      asText(getInputValue(typed, "perm_street")),
      asText(getInputValue(typed, "perm_barangay")),
      asText(getInputValue(typed, "perm_town_city")),
      asInt(getInputValue(typed, "perm_zip_code")),
      asText(getInputValue(typed, "perm_province")),
      asText(getInputValue(typed, "father")),
      asText(getInputValue(typed, "father_occupation")),
      asText(getInputValue(typed, "father_company")),
      asText(getInputValue(typed, "father_company_address")),
      asText(getInputValue(typed, "father_tel_no")),
      asText(getInputValue(typed, "father_email")),
      asText(getInputValue(typed, "mother")),
      asText(getInputValue(typed, "mother_occupation")),
      asText(getInputValue(typed, "mother_company")),
      asText(getInputValue(typed, "mother_company_address")),
      asText(getInputValue(typed, "mother_tel_no")),
      asText(getInputValue(typed, "mother_email")),
      asText(getInputValue(typed, "guardian")),
      asText(getInputValue(typed, "guardian_relationship")),
      asText(getInputValue(typed, "guardian_address")),
      asText(getInputValue(typed, "guardian_occupation")),
      asText(getInputValue(typed, "guardian_company")),
      asText(getInputValue(typed, "guardian_tel_no")),
      asText(getInputValue(typed, "guardian_email")),
      asText(getInputValue(typed, "emergency_contact")),
      asText(getInputValue(typed, "emergency_address")),
      asText(getInputValue(typed, "emergency_mobile_no")),
      asText(getInputValue(typed, "emergency_tel_no")),
      asText(getInputValue(typed, "elem_school")),
      asText(getInputValue(typed, "elem_address")),
      asText(getInputValue(typed, "elem_incl_dates")),
      asText(getInputValue(typed, "hs_school")),
      asText(getInputValue(typed, "hs_address")),
      asText(getInputValue(typed, "hs_incl_dates")),
      asFloat(getInputValue(typed, "form137_gwa")),
      asFloat(getInputValue(typed, "form137_math")),
      asFloat(getInputValue(typed, "form137_science")),
      asFloat(getInputValue(typed, "form137_english")),
      asInt(choicesCampus[0]),
      asInt(choicesCampus[1]),
      asInt(choicesCampus[2]),
      asInt(choicesCampus[3]),
      asInt(choicesCourse[0]),
      asInt(choicesCourse[1]),
      asInt(choicesCourse[2]),
      asInt(choicesCourse[3]),
      choiceMajorId(0),
      choiceMajorId(1),
      choiceMajorId(2),
      choiceMajorId(3),
      asText(getInputValue(typed, "or_no")),
      JSON.stringify(payload),
    ]
  );
  return r.rows[0];
};

type NewApplicationInput = {
  appNo?: string;
  appDate?: string | null;
  termId?: number | null;
  applyTypeId?: number | null;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  middleInitial?: string;
  gender?: string;
  dateOfBirth?: string | null;
  choiceCampusId?: number | null;
  choiceCourseId?: number | null;
  choiceMajorStudy?: string | null;
  orNo?: string;
};

const generateAppNo = () => `APP${Date.now().toString().slice(-11)}`;

export const createAdmissionApplication = async (input: NewApplicationInput) => {
  await ensureAdmissionApplicantProfilesTable();
  const appNo = asText(input.appNo) || generateAppNo();
  const appDate = parseAppDate(input.appDate ?? null);
  const dateOfBirth = parseAppDate(input.dateOfBirth ?? null);
  const majorStudy = asText(input.choiceMajorStudy);
  let choiceMajorId: number | null = null;
  if (majorStudy) {
    const major = await pool.query(
      `
      SELECT id
      FROM ched_major_disciplines
      WHERE TRIM(major_discipline) = $1
      LIMIT 1
      `,
      [majorStudy]
    );
    if (major.rows[0]?.id) {
      choiceMajorId = Number(major.rows[0].id);
    }
  }
  const payload: ApplicantPayload = {
    controlledDraft: {
      yearTermId: input.termId ? String(input.termId) : "",
      choiceCampusIds: [input.choiceCampusId ? String(input.choiceCampusId) : "__none__", "__none__", "__none__", "__none__"],
      choiceProgramIds: [input.choiceCourseId ? String(input.choiceCourseId) : "__none__", "__none__", "__none__", "__none__"],
      choiceMajorValues: [majorStudy || "__none__", "__none__", "__none__", "__none__"],
    },
    inputDraft: {
      "input::app_no": appNo,
      "input::app_date": appDate ? appDate.slice(0, 10) : "",
      "input::or_no": asText(input.orNo),
      "input::last_name": asText(input.lastName),
      "input::first_name": asText(input.firstName),
      "input::middle_name": asText(input.middleName),
      "input::middle_initial": asText(input.middleInitial),
      "input::date_of_birth": dateOfBirth ? dateOfBirth.slice(0, 10) : "",
      "input::gender": asText(input.gender).slice(0, 1),
      "select::application_type": asText(input.applyTypeId),
    },
  };
  const r = await pool.query(
    `
    INSERT INTO admission_applicants (
      app_no, app_date, term_id, apply_type_id,
      last_name, first_name, middle_name, middle_initial, gender, date_of_birth,
      choice1_campus_id, choice1_course, choice1_course_major, or_no, payload,
      created_at, updated_at
    ) VALUES (
      LEFT($1, 15), COALESCE($2::timestamptz, CURRENT_TIMESTAMP), $3, $4,
      $5, $6, $7, $8, $9, $10::timestamptz,
      $11, $12, $13, $14, $15::jsonb,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING app_no, app_date, term_id, adm_status_id, last_name, first_name, gender, date_of_birth, choice1_campus_id, choice1_course, choice1_course_major, or_no
    `,
    [
      appNo,
      appDate,
      input.termId ?? null,
      input.applyTypeId ?? null,
      asText(input.lastName),
      asText(input.firstName),
      asText(input.middleName),
      asText(input.middleInitial),
      asText(input.gender).slice(0, 1),
      dateOfBirth,
      input.choiceCampusId ?? null,
      input.choiceCourseId ?? null,
      choiceMajorId,
      asText(input.orNo),
      JSON.stringify(payload),
    ]
  );
  return r.rows[0];
};

export const getAdmissionApplications = async (termId?: number, campusId?: number) => {
  await ensureAdmissionApplicantProfilesTable();
  const where: string[] = [];
  const params: Array<number> = [];
  if (Number.isFinite(termId)) {
    where.push(`a.term_id = $${params.length + 1}`);
    params.push(Number(termId));
  }
  if (Number.isFinite(campusId)) {
    where.push(`a.choice1_campus_id = $${params.length + 1}`);
    params.push(Number(campusId));
  }
  const q = `
    SELECT
      a.app_no,
      a.app_date,
      a.last_name,
      a.first_name,
      a.gender,
      a.date_of_birth,
      a.choice1_campus_id,
      c.acronym AS choice1_campus,
      a.choice1_course,
      p.program_code AS choice1_program_code,
      p.program_name AS choice1_program_name
    FROM admission_applicants a
    LEFT JOIN campuses c ON c.id = a.choice1_campus_id
    LEFT JOIN academic_programs p ON p.id = a.choice1_course
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY a.app_date DESC, a.app_no DESC
  `;
  const r = await pool.query(q, params);
  return r.rows;
};

export const applyApplicationStatusAction = async (
  appNo: string,
  action: "admit" | "deny" | "cancel",
  denyReason?: string
) => {
  await ensureAdmissionApplicantProfilesTable();
  const current = await pool.query(
    `
    SELECT app_no, adm_status_id
    FROM admission_applicants
    WHERE app_no = LEFT($1, 15)
    LIMIT 1
    `,
    [appNo]
  );
  if (!current.rows[0]) return null;
  const currentStatus = Number(current.rows[0].adm_status_id ?? 1);

  let nextStatus = currentStatus;
  let nextDenyReason = "";
  if (action === "admit") {
    nextStatus = 3; // APPROVED / ADMITTED
    nextDenyReason = "";
  } else if (action === "deny") {
    nextStatus = 4; // DENIED
    nextDenyReason = asText(denyReason);
  } else {
    // cancel rule:
    // - if admitted then cancel => cancelled
    // - if denied then cancel => in-process
    // - otherwise fallback => in-process
    if (currentStatus === 3) nextStatus = 5; // CANCELLED
    else nextStatus = 2; // IN-PROCESS
    nextDenyReason = "";
  }

  const updated = await pool.query(
    `
    UPDATE admission_applicants
    SET
      adm_status_id = $2,
      deny_reason = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE app_no = LEFT($1, 15)
    RETURNING app_no, adm_status_id, deny_reason, updated_at
    `,
    [appNo, nextStatus, nextDenyReason]
  );
  return updated.rows[0] ?? null;
};
