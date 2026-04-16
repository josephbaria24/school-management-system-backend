import fs from "node:fs/promises";
import path from "node:path";
import pool from "../db.js";
import { ensureCoursesMasterListTable } from "../services/coursesMasterList.service.js";
import { ensureSubjectAreasTable } from "../services/subjectAreas.service.js";
import { ensureSubjectModesTable } from "../services/subjectModes.service.js";

type SourceRow = {
  SubjectID?: number;
  SubjectCode?: string | null;
  SubjectTitle?: string | null;
  SubjectDesc?: string | null;
  SubjectGE?: string | number | boolean | null;
  SubjectElective?: string | number | boolean | null;
  SubjectMajor?: string | number | boolean | null;
  SubjectComputer?: string | number | boolean | null;
  SubjectELearning?: string | number | boolean | null;
  SubjectWithInternet?: string | number | boolean | null;
  InclGWA?: string | number | boolean | null;
  IsNonAcademic?: string | number | boolean | null;
  IsClubOrganization?: string | number | boolean | null;
  OtherSchool?: string | number | boolean | null;
  IsTransmutedGrade?: string | number | boolean | null;
  Inactive?: string | number | boolean | null;
  AcadUnits?: number | string | null;
  CreditUnits?: number | string | null;
  LectHrs?: number | string | null;
  LabUnits?: number | string | null;
  LabHrs?: number | string | null;
  Alias1?: string | null;
  Alias2?: string | null;
  SubjParentID?: string | number | null;
  LevelID?: number | string | null;
  SubjectAreaID?: number | string | null;
  SubjectMode?: number | string | null;
  MinSize?: number | string | null;
  MaxSize?: number | string | null;
};

const LEVEL_MAP: Record<number, string> = {
  11: "Pre-School",
  12: "Elementary: Primary Level",
  20: "Elementary: Intermediate Level",
  30: "Secondary Level",
  40: "Technical / Vocational",
  50: "Baccalaureate Degree",
  60: "Pre-Baccalaureate Diploma, Certificate or Associate Degree",
  70: "Bachelor of Laws, Doctor of Jurisprudence",
  80: "Post-Baccalaureate Degree Diploma or Certificate",
  90: "MD",
};

const toText = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const toInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? Math.trunc(v) : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};

const toBool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
};

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: npx tsx src/scripts/importEsSubjects.ts <path-to-json>");
    process.exit(1);
  }

  const resolved = path.resolve(inputPath);
  const raw = await fs.readFile(resolved, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array");
  }

  const allRows = parsed as SourceRow[];
  await ensureCoursesMasterListTable();
  await ensureSubjectAreasTable();
  await ensureSubjectModesTable();

  const areaMap = new Map<number, string>();
  const modeMap = new Map<number, string>();

  {
    const r = await pool.query(`SELECT area_code, area_name FROM subject_areas`);
    for (const row of r.rows) {
      const code = toInt(row.area_code);
      const name = toText(row.area_name);
      if (code !== null && name) areaMap.set(code, name);
    }
  }
  {
    const r = await pool.query(`SELECT mode_code, mode_name FROM subject_modes`);
    for (const row of r.rows) {
      const code = toInt(row.mode_code);
      const name = toText(row.mode_name);
      if (code !== null && name) modeMap.set(code, name);
    }
  }

  // Dedupe by course code; keep highest SubjectID if duplicates exist.
  const deduped = new Map<string, SourceRow>();
  let skippedNoCode = 0;
  for (const row of allRows) {
    const code = toText(row.SubjectCode);
    if (!code) {
      skippedNoCode += 1;
      continue;
    }
    const current = deduped.get(code);
    if (!current) {
      deduped.set(code, row);
      continue;
    }
    const curId = toInt(current.SubjectID) ?? -1;
    const newId = toInt(row.SubjectID) ?? -1;
    if (newId >= curId) deduped.set(code, row);
  }

  const rows = [...deduped.values()].filter((r) => toText(r.SubjectTitle));
  let skippedNoTitle = deduped.size - rows.length;

  await pool.query("BEGIN");
  try {
    let upserted = 0;
    for (const row of rows) {
      const courseCode = toText(row.SubjectCode);
      const courseTitle = toText(row.SubjectTitle);
      if (!courseCode || !courseTitle) continue;

      const levelId = toInt(row.LevelID);
      const areaId = toInt(row.SubjectAreaID);
      const modeId = toInt(row.SubjectMode);

      await pool.query(
        `
        INSERT INTO courses_master_list (
          course_code, course_title, course_description,
          laboratory_units, academic_units_lecture, credited_units, lecture_hours, laboratory_hours,
          general_education, major_course, elective_course, computer_course, e_learning,
          course_with_internet, include_in_gwa, non_academic_course, club_organization_course,
          from_other_school, use_transmuted_grade, is_inactive,
          code_alias_1, code_alias_2, parent_code, course_level, course_area, course_mode,
          default_min_class_limit, default_max_class_limit, is_locked_subject
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
        )
        ON CONFLICT (course_code) DO UPDATE SET
          course_title = EXCLUDED.course_title,
          course_description = EXCLUDED.course_description,
          laboratory_units = EXCLUDED.laboratory_units,
          academic_units_lecture = EXCLUDED.academic_units_lecture,
          credited_units = EXCLUDED.credited_units,
          lecture_hours = EXCLUDED.lecture_hours,
          laboratory_hours = EXCLUDED.laboratory_hours,
          general_education = EXCLUDED.general_education,
          major_course = EXCLUDED.major_course,
          elective_course = EXCLUDED.elective_course,
          computer_course = EXCLUDED.computer_course,
          e_learning = EXCLUDED.e_learning,
          course_with_internet = EXCLUDED.course_with_internet,
          include_in_gwa = EXCLUDED.include_in_gwa,
          non_academic_course = EXCLUDED.non_academic_course,
          club_organization_course = EXCLUDED.club_organization_course,
          from_other_school = EXCLUDED.from_other_school,
          use_transmuted_grade = EXCLUDED.use_transmuted_grade,
          is_inactive = EXCLUDED.is_inactive,
          code_alias_1 = EXCLUDED.code_alias_1,
          code_alias_2 = EXCLUDED.code_alias_2,
          parent_code = EXCLUDED.parent_code,
          course_level = EXCLUDED.course_level,
          course_area = EXCLUDED.course_area,
          course_mode = EXCLUDED.course_mode,
          default_min_class_limit = EXCLUDED.default_min_class_limit,
          default_max_class_limit = EXCLUDED.default_max_class_limit,
          is_locked_subject = EXCLUDED.is_locked_subject,
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          courseCode,
          courseTitle,
          toText(row.SubjectDesc),
          toNumber(row.LabUnits) ?? 0,
          toNumber(row.AcadUnits) ?? 0,
          toNumber(row.CreditUnits) ?? 0,
          toNumber(row.LectHrs) ?? 0,
          toNumber(row.LabHrs) ?? 0,
          toBool(row.SubjectGE),
          toBool(row.SubjectMajor),
          toBool(row.SubjectElective),
          toBool(row.SubjectComputer),
          toBool(row.SubjectELearning),
          toBool(row.SubjectWithInternet),
          toBool(row.InclGWA),
          toBool(row.IsNonAcademic),
          toBool(row.IsClubOrganization),
          toBool(row.OtherSchool),
          toBool(row.IsTransmutedGrade),
          toBool(row.Inactive),
          toText(row.Alias1),
          toText(row.Alias2),
          toText(row.SubjParentID),
          levelId !== null ? LEVEL_MAP[levelId] ?? null : null,
          areaId !== null ? areaMap.get(areaId) ?? null : null,
          modeId !== null ? modeMap.get(modeId) ?? null : null,
          toInt(row.MinSize),
          toInt(row.MaxSize),
          false,
        ]
      );
      upserted += 1;
    }

    await pool.query("COMMIT");
    console.log("Import complete.");
    console.log(`Source rows: ${allRows.length}`);
    console.log(`Skipped (no code): ${skippedNoCode}`);
    console.log(`Skipped (no title): ${skippedNoTitle}`);
    console.log(`Upserted rows: ${upserted}`);
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  } finally {
    await pool.end();
  }
}

main().catch(async (err) => {
  console.error("Import failed:", err);
  try {
    await pool.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
