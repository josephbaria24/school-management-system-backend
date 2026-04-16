import fs from "node:fs/promises";
import path from "node:path";
import pool from "../db.js";
import { ensureAcademicProgramsTable } from "../services/academicPrograms.service.js";

type SourceProgram = {
  CampusID?: number | string | null;
  CollegeID?: number | string | null;
  ProgCode?: string | null;
  ProgName?: string | null;
  ProgShortName?: string | null;
  NumberCode?: string | number | null;
  ProgStatus?: number | string | null;
  Semestral?: number | string | null;
  Alias?: string | number | boolean | null;
  ProgYears?: number | string | null;
  MaxResidency?: number | string | null;
  TotalAcadSubject?: number | string | null;
  TotalAcadCreditUnits?: number | string | null;
  Weight?: number | string | null;
  TotalGenEdUnits?: number | string | null;
  TotalMajorUnits?: number | string | null;
  TotalElectiveUnits?: number | string | null;
  TotalLectureUnits?: number | string | null;
  TotalNonLectUnits?: number | string | null;
  ProgClass?: number | string | null;
  ThesisReqID?: number | string | null;
  BoardExam?: string | null;
  ProgLadder?: string | null;
  ProgParent?: string | null;
  ProgRecognize?: string | null;
  ProgRevise?: string | null;
};

const toText = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

const toInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? Math.trunc(v) : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const toBool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
};

const toLegacyDate = (v: unknown): string | null => {
  const s = toText(v);
  if (!s) return null;
  // Legacy format sample: 24/5/2013 10:27:22
  const [datePart] = s.split(" ");
  const chunks = datePart.split("/");
  if (chunks.length !== 3) return null;
  const dd = parseInt(chunks[0] || "", 10);
  const mm = parseInt(chunks[1] || "", 10);
  const yyyy = parseInt(chunks[2] || "", 10);
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null;
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (Number.isNaN(d.getTime())) return null;
  return `${yyyy.toString().padStart(4, "0")}-${mm.toString().padStart(2, "0")}-${dd
    .toString()
    .padStart(2, "0")}`;
};

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: npx tsx src/scripts/importEsPrograms.ts <path-to-json>");
    process.exit(1);
  }

  await ensureAcademicProgramsTable();
  const raw = await fs.readFile(path.resolve(inputPath), "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array");
  }
  const source = parsed as SourceProgram[];

  const campuses = await pool.query(`SELECT id FROM campuses`);
  const colleges = await pool.query(`SELECT id, campus_id FROM colleges`);
  const campusIds = new Set<number>(campuses.rows.map((r) => Number(r.id)));
  const collegeCampus = new Map<number, number>(
    colleges.rows.map((r) => [Number(r.id), Number(r.campus_id)])
  );

  const deduped = new Map<string, SourceProgram>();
  let skippedNoCode = 0;
  let skippedNoName = 0;
  let skippedMissingFk = 0;
  let skippedFkMismatch = 0;
  let upserted = 0;

  for (const row of source) {
    const programCode = toText(row.ProgCode);
    const programName = toText(row.ProgName);
    const campusId = toInt(row.CampusID);
    const collegeId = toInt(row.CollegeID);

    if (!programCode) {
      skippedNoCode += 1;
      continue;
    }
    if (!programName) {
      skippedNoName += 1;
      continue;
    }
    if (
      campusId === null ||
      collegeId === null ||
      !campusIds.has(campusId) ||
      !collegeCampus.has(collegeId)
    ) {
      skippedMissingFk += 1;
      continue;
    }
    if (collegeCampus.get(collegeId) !== campusId) {
      skippedFkMismatch += 1;
      continue;
    }
    const key = `${collegeId}::${programCode}`;
    deduped.set(key, row);
  }

  await pool.query("BEGIN");
  try {
    for (const row of deduped.values()) {
      const campusId = toInt(row.CampusID);
      const collegeId = toInt(row.CollegeID);
      const programCode = toText(row.ProgCode);
      const programName = toText(row.ProgName);
      if (campusId === null || collegeId === null || !programCode || !programName) continue;

      await pool.query(
        `
        INSERT INTO academic_programs (
          campus_id, college_id, program_code, program_name, short_name, admission_number_code,
          status, term, program_alias, no_of_years, max_residency, total_academic_subjects,
          total_academic_credit_units, academic_program_weight, total_ge_units, total_major_units,
          total_elective_units, total_lecture_units, total_non_lecture_units,
          classification, thesis_option, board_exam, ladder, parent_program,
          date_recognized, date_revised
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
        )
        ON CONFLICT (college_id, program_code) DO UPDATE SET
          campus_id = EXCLUDED.campus_id,
          program_name = EXCLUDED.program_name,
          short_name = EXCLUDED.short_name,
          admission_number_code = EXCLUDED.admission_number_code,
          status = EXCLUDED.status,
          term = EXCLUDED.term,
          program_alias = EXCLUDED.program_alias,
          no_of_years = EXCLUDED.no_of_years,
          max_residency = EXCLUDED.max_residency,
          total_academic_subjects = EXCLUDED.total_academic_subjects,
          total_academic_credit_units = EXCLUDED.total_academic_credit_units,
          academic_program_weight = EXCLUDED.academic_program_weight,
          total_ge_units = EXCLUDED.total_ge_units,
          total_major_units = EXCLUDED.total_major_units,
          total_elective_units = EXCLUDED.total_elective_units,
          total_lecture_units = EXCLUDED.total_lecture_units,
          total_non_lecture_units = EXCLUDED.total_non_lecture_units,
          classification = EXCLUDED.classification,
          thesis_option = EXCLUDED.thesis_option,
          board_exam = EXCLUDED.board_exam,
          ladder = EXCLUDED.ladder,
          parent_program = EXCLUDED.parent_program,
          date_recognized = EXCLUDED.date_recognized,
          date_revised = EXCLUDED.date_revised,
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          campusId,
          collegeId,
          programCode,
          programName,
          toText(row.ProgShortName),
          toText(row.NumberCode),
          toInt(row.ProgStatus) === 1 ? "active" : "inactive",
          toInt(row.Semestral) === 1 ? "Semestral" : null,
          toBool(row.Alias),
          toInt(row.ProgYears),
          toInt(row.MaxResidency),
          toInt(row.TotalAcadSubject),
          toNum(row.TotalAcadCreditUnits),
          toNum(row.Weight),
          toNum(row.TotalGenEdUnits),
          toNum(row.TotalMajorUnits),
          toNum(row.TotalElectiveUnits),
          toNum(row.TotalLectureUnits),
          toNum(row.TotalNonLectUnits),
          toText(row.ProgClass),
          toText(row.ThesisReqID),
          toText(row.BoardExam),
          toText(row.ProgLadder),
          toText(row.ProgParent),
          toLegacyDate(row.ProgRecognize),
          toLegacyDate(row.ProgRevise),
        ]
      );
      upserted += 1;
    }
    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  } finally {
    await pool.end();
  }

  console.log("Import complete.");
  console.log(`Source rows: ${source.length}`);
  console.log(`Skipped (no code): ${skippedNoCode}`);
  console.log(`Skipped (no name): ${skippedNoName}`);
  console.log(`Skipped (missing campus/college): ${skippedMissingFk}`);
  console.log(`Skipped (college-campus mismatch): ${skippedFkMismatch}`);
  console.log(`Eligible unique rows: ${deduped.size}`);
  console.log(`Upserted rows: ${upserted}`);
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
