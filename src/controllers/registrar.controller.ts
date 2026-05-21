import { Request, Response } from "express";
import * as scholastic from "../services/scholasticDelinquency.service.js";
import * as grading from "../services/gradingSystem.service.js";
import * as addDrop from "../services/addDropWithdrawal.service.js";
import * as addDropCfg from "../services/addDropModuleConfig.service.js";
import * as gradeSheetInv from "../services/gradeSheetInventory.service.js";
import * as unpostedGradesInv from "../services/unpostedGradesInventory.service.js";
import * as correctionGrades from "../services/correctionOfGrades.service.js";
import * as incompleteGrades from "../services/studentsWithIncompleteGrade.service.js";
import * as summaryRecalc from "../services/recalculateSummaryOfGrades.service.js";
import * as gradeEncoding from "../services/gradeEncoding.service.js";
import * as reportOfGrades from "../services/reportOfGrades.service.js";
import * as gpaRanking from "../services/gradePointAverageRanking.service.js";
import * as worksheetGrades from "../services/worksheetForConsolidatedGrades.service.js";
import * as tagGraduating from "../services/tagGraduatingStudents.service.js";
import * as graduateCandidates from "../services/graduateCandidatesForGraduation.service.js";
import * as certification from "../services/certification.service.js";
import * as chedReports from "../services/chedReports.service.js";
import * as listOfReports from "../services/listOfReports.service.js";

function parseIntParam(v: unknown, label: string): number | null {
  const n = parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/* --- Scholastic delinquency --- */

export const getScholasticDelinquency = async (_req: Request, res: Response) => {
  try {
    const rows = await scholastic.listScholasticDelinquencyRules();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load scholastic delinquency rules" });
  }
};

export const putScholasticDelinquency = async (req: Request, res: Response) => {
  try {
    const raw = req.body?.rows;
    if (!Array.isArray(raw)) {
      return res.status(400).json({ error: "Body must include rows: []" });
    }
    const rows: scholastic.ScholasticDelinquencyInput[] = raw.map((r: Record<string, unknown>) => ({
      min_units_enrolled: Number(r.min_units_enrolled ?? r.minUnitsEnrolled ?? 0),
      max_units_enrolled: Number(r.max_units_enrolled ?? r.maxUnitsEnrolled ?? 0),
      min_percent_subject: Number(r.min_percent_subject ?? r.minPercentSubject ?? 0),
      max_percent_subject: Number(r.max_percent_subject ?? r.maxPercentSubject ?? 0),
      status_text: String(r.status_text ?? r.statusText ?? ""),
      less_to_allowable: Number(r.less_to_allowable ?? r.lessToAllowable ?? 0),
    }));
    const out = await scholastic.replaceScholasticDelinquencyRules(rows);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save scholastic delinquency rules" });
  }
};

/* --- Grading system --- */

export const getGradingSystem = async (req: Request, res: Response) => {
  try {
    const gradeLevel = String(req.query.gradeLevel ?? "").trim();
    const formatKey = String(req.query.format ?? "format_1").trim() || "format_1";
    if (!gradeLevel) {
      return res.status(400).json({ error: "Query gradeLevel is required" });
    }
    const rows = await grading.listGradingRows(gradeLevel, formatKey);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load grading rows" });
  }
};

export const putGradingSystem = async (req: Request, res: Response) => {
  try {
    const gradeLevel = String(req.body?.gradeLevel ?? "").trim();
    const formatKey = String(req.body?.format ?? req.body?.formatKey ?? "format_1").trim() || "format_1";
    const raw = req.body?.rows;
    if (!gradeLevel) return res.status(400).json({ error: "gradeLevel is required" });
    if (!Array.isArray(raw)) return res.status(400).json({ error: "rows array required" });
    const rows = raw.map((r: Record<string, unknown>) => ({
      grade_point: String(r.grade_point ?? r.gradePoint ?? ""),
      equivalence: String(r.equivalence ?? ""),
      letter_grade: String(r.letter_grade ?? r.letterGrade ?? ""),
      description: String(r.description ?? ""),
      remarks: String(r.remarks ?? ""),
      disqualify_scholarship: Boolean(r.disqualify_scholarship ?? r.disqualifyScholarshipAcademicHonor),
      hide_faculty_encoding: Boolean(r.hide_faculty_encoding ?? r.hideFromFacultyGradeEncoding),
      grades_following_periods: Boolean(r.grades_following_periods ?? r.gradesAlsoForFollowingPeriods),
      hide_evaluation: Boolean(r.hide_evaluation ?? r.hideFromEvaluationForm),
      hide_report_grade: Boolean(r.hide_report_grade ?? r.hideFromReportOfGrade),
      credit_unit: Boolean(r.credit_unit ?? r.credit),
      compute_gwa: Boolean(r.compute_gwa ?? r.compute),
      hide_final: Boolean(r.hide_final ?? r.hideFinal),
      hide_midterm: Boolean(r.hide_midterm ?? r.hideMidterm),
      grades_other_school: Boolean(r.grades_other_school ?? r.gradesForOtherSchool),
      grade_applies_for: String(r.grade_applies_for ?? r.gradeAppliesFor ?? "GENERAL").slice(0, 80),
    }));
    const out = await grading.replaceGradingRows(gradeLevel, formatKey, rows);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save grading rows" });
  }
};

/* --- Add / drop / withdrawal --- */

export const getAddDropTransactions = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    const rows = await addDrop.listAddDropTransactions(termId);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list transactions" });
  }
};

export const postAddDropTransaction = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    if (termId == null) return res.status(400).json({ error: "academic_year_term_id required" });
    const row = await addDrop.createTransaction(termId, req.body ?? {});
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to create transaction" });
  }
};

export const deleteAddDropTransaction = async (req: Request, res: Response) => {
  try {
    const id = parseIntParam(req.params.id, "id");
    if (id == null) return res.status(400).json({ error: "Invalid id" });
    await addDrop.deleteTransaction(id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to delete" });
  }
};

export const getAddDropWithdrawn = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    const rows = await addDrop.listAddDropWithdrawn(termId);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to list withdrawn" });
  }
};

export const postAddDropWithdrawn = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    if (termId == null) return res.status(400).json({ error: "academic_year_term_id required" });
    const row = await addDrop.createWithdrawn(termId, req.body ?? {});
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to create withdrawn record" });
  }
};

export const deleteAddDropWithdrawn = async (req: Request, res: Response) => {
  try {
    const id = parseIntParam(req.params.id, "id");
    if (id == null) return res.status(400).json({ error: "Invalid id" });
    await addDrop.deleteWithdrawn(id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to delete" });
  }
};

export const getAddDropSchedule = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const studentNo = String(req.query.studentNo ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    if (!studentNo) return res.status(400).json({ error: "studentNo query required" });
    const rows = await addDrop.listScheduleLines(termId, studentNo);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load schedule" });
  }
};

export const putAddDropSchedule = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const studentNo = String(req.body?.student_no ?? req.body?.studentNo ?? "").trim();
    const rows = req.body?.rows;
    if (termId == null) return res.status(400).json({ error: "academic_year_term_id required" });
    if (!studentNo) return res.status(400).json({ error: "student_no required" });
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows array required" });
    const out = await addDrop.replaceScheduleLines(termId, studentNo, rows);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save schedule" });
  }
};

export const getAddDropStaging = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const studentNo = String(req.query.studentNo ?? "").trim();
    const transactionCode = String(req.query.transactionCode ?? "00000000").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    if (!studentNo) return res.status(400).json({ error: "studentNo query required" });
    const rows = await addDrop.listStagingLines(termId, studentNo, transactionCode);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load staging" });
  }
};

export const putAddDropStaging = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const studentNo = String(req.body?.student_no ?? req.body?.studentNo ?? "").trim();
    const transactionCode = String(req.body?.transaction_code ?? req.body?.transactionCode ?? "00000000").trim();
    const rows = req.body?.rows;
    if (termId == null) return res.status(400).json({ error: "academic_year_term_id required" });
    if (!studentNo) return res.status(400).json({ error: "student_no required" });
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows array required" });
    const out = await addDrop.replaceStagingLines(termId, studentNo, transactionCode, rows);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save staging" });
  }
};

export const getAddDropModuleConfig = async (_req: Request, res: Response) => {
  try {
    const c = await addDropCfg.getAddDropModuleConfig();
    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load add/drop module configuration" });
  }
};

export const putAddDropModuleConfig = async (req: Request, res: Response) => {
  try {
    const c = await addDropCfg.saveAddDropModuleConfig((req.body ?? {}) as Record<string, unknown>);
    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save add/drop module configuration" });
  }
};

export const getGradeSheetInventory = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    const campus = String(req.query.campus ?? "").trim();
    if (!campus) return res.status(400).json({ error: "campus query required" });
    const view = String(req.query.view ?? "all").trim() || "all";
    const subjectCode = String(req.query.subjectCode ?? "").trim();
    const section = String(req.query.section ?? "").trim();
    const rows = await gradeSheetInv.listGradeSheetInventory(termId, campus, view, subjectCode, section);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load grade sheet inventory" });
  }
};

export const putGradeSheetInventory = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const campus = String(req.body?.campus ?? "").trim();
    const raw = req.body?.rows;
    if (termId == null) return res.status(400).json({ error: "academic_year_term_id required" });
    if (!campus) return res.status(400).json({ error: "campus required" });
    if (!Array.isArray(raw)) return res.status(400).json({ error: "rows array required" });
    const rows: gradeSheetInv.GradeSheetInventoryInput[] = raw.map((r: Record<string, unknown>) => {
      const optStr = (v: unknown) => {
        if (v == null) return null;
        const s = String(v).trim();
        return s === "" ? null : s;
      };
      const optNum = (v: unknown) => {
        if (v == null || v === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      return {
        subject_code: optStr(r.subject_code ?? r.subjectCode),
        subject_title: optStr(r.subject_title ?? r.subjectTitle),
        section: optStr(r.section),
        identifier: optStr(r.identifier),
        sheet_status: optStr(r.sheet_status ?? r.sheetStatus),
        sort_order: optNum(r.sort_order ?? r.sortOrder),
        notes: optStr(r.notes),
      };
    });
    const out = await gradeSheetInv.replaceGradeSheetInventory(termId, campus, rows);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save grade sheet inventory" });
  }
};

export const getUnpostedGradesInventory = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    const campus = String(req.query.campus ?? "").trim();
    if (!campus) return res.status(400).json({ error: "campus query required" });
    const collegeCode = String(req.query.collegeCode ?? req.query.college_code ?? "").trim();
    if (!collegeCode) return res.status(400).json({ error: "collegeCode query required" });
    const programCode = String(req.query.programCode ?? req.query.program_code ?? "").trim();
    const yearLevel = String(req.query.yearLevel ?? req.query.year_level ?? "").trim();
    const rows = await unpostedGradesInv.listUnpostedGrades(termId, campus, collegeCode, programCode, yearLevel);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load unposted grades inventory" });
  }
};

export const putUnpostedGradesInventory = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const campus = String(req.body?.campus ?? "").trim();
    const collegeCode = String(req.body?.college_code ?? req.body?.collegeCode ?? "").trim();
    const raw = req.body?.rows;
    if (termId == null) return res.status(400).json({ error: "academic_year_term_id required" });
    if (!campus) return res.status(400).json({ error: "campus required" });
    if (!collegeCode) return res.status(400).json({ error: "college_code required" });
    if (!Array.isArray(raw)) return res.status(400).json({ error: "rows array required" });
    const optStr = (v: unknown) => {
      if (v == null) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };
    const optNum = (v: unknown) => {
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const rows: unpostedGradesInv.UnpostedGradeInput[] = raw.map((r: Record<string, unknown>) => ({
      program_code: optStr(r.program_code ?? r.programCode),
      year_level: optStr(r.year_level ?? r.yearLevel),
      grade_idx: optStr(r.grade_idx ?? r.gradeIdx),
      student_no: optStr(r.student_no ?? r.studentNo),
      student_name: optStr(r.student_name ?? r.studentName),
      college: optStr(r.college),
      program: optStr(r.program),
      year_level_display: optStr(r.year_level_display ?? r.yearLevelDisplay),
      course_code: optStr(r.course_code ?? r.courseCode),
      course_title: optStr(r.course_title ?? r.courseTitle),
      class_section: optStr(r.class_section ?? r.classSection),
      midterm: optStr(r.midterm),
      final: optStr(r.final),
      remarks: optStr(r.remarks),
      reg_id: optStr(r.reg_id ?? r.regId),
      sort_order: optNum(r.sort_order ?? r.sortOrder),
    }));
    const out = await unpostedGradesInv.replaceUnpostedGrades(termId, campus, collegeCode, rows);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save unposted grades inventory" });
  }
};

export const getCorrectionOfGrades = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const studentNo = String(req.query.studentNo ?? "").trim();
    const gradeLevel = String(req.query.gradeLevel ?? req.query.grade_level ?? "College").trim() || "College";
    const formatKey = String(req.query.format ?? req.query.formatKey ?? "format_1").trim() || "format_1";
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    if (!studentNo) return res.status(400).json({ error: "studentNo query required" });
    const data = await correctionGrades.getCorrectionWorkspace(termId, studentNo, { gradeLevel, formatKey });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load correction of grades" });
  }
};

export const putCorrectionOfGrades = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const studentNo = String(req.body?.student_no ?? req.body?.studentNo ?? "").trim();
    const raw = req.body?.rows;
    if (termId == null) return res.status(400).json({ error: "academic_year_term_id required" });
    if (!studentNo) return res.status(400).json({ error: "student_no required" });
    if (!Array.isArray(raw)) return res.status(400).json({ error: "rows array required" });
    const optStr = (v: unknown) => {
      if (v == null) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };
    const optNum = (v: unknown) => {
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const sessRaw = req.body?.session as Record<string, unknown> | undefined;
    const session: correctionGrades.CorrectionSessionInput | undefined =
      sessRaw && typeof sessRaw === "object"
        ? {
            registration_no: optStr(sessRaw.registration_no ?? sessRaw.registrationNo),
            registration_date: optStr(sessRaw.registration_date ?? sessRaw.registrationDate),
            year_level: optStr(sessRaw.year_level ?? sessRaw.yearLevel),
            college: optStr(sessRaw.college),
            program: optStr(sessRaw.program),
            encoded_by: optStr(sessRaw.encoded_by ?? sessRaw.encodedBy),
            date_posted: optStr(sessRaw.date_posted ?? sessRaw.datePosted),
          }
        : undefined;
    const rows: correctionGrades.CorrectionLineInput[] = raw.map((r: Record<string, unknown>) => ({
      class_section: optStr(r.class_section ?? r.classSection),
      subject_code: optStr(r.subject_code ?? r.subjectCode),
      subject_title: optStr(r.subject_title ?? r.subjectTitle),
      midterm: optStr(r.midterm),
      final: optStr(r.final),
      re_exam: optStr(r.re_exam ?? r.reExam),
      remarks: optStr(r.remarks),
      credit_units: optNum(r.credit_units ?? r.creditUnits),
      sort_order: optNum(r.sort_order ?? r.sortOrder),
    }));
    const gradeLevel = String(req.body?.gradeLevel ?? req.body?.grade_level ?? "College").trim() || "College";
    const formatKey = String(req.body?.format ?? req.body?.formatKey ?? "format_1").trim() || "format_1";
    const out = await correctionGrades.saveCorrectionWorkspace(termId, studentNo, session, rows, {
      gradeLevel,
      formatKey,
    });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save correction of grades" });
  }
};

/* --- Students with incomplete grade --- */

export const getStudentsWithIncompleteGrade = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    if (campusId == null) return res.status(400).json({ error: "campusId query required" });
    const eligibleOnly = String(req.query.eligibleOnly ?? "true").toLowerCase() !== "false";
    const data = await incompleteGrades.listIncompleteGradeLines(termId, campusId, { eligibleOnly });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load incomplete grade list" });
  }
};

export const putStudentsWithIncompleteGradeSettings = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const campusId = parseIntParam(req.body?.campus_id ?? req.body?.campusId, "campus");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    const raw = req.body?.inc_due_date ?? req.body?.incDueDate;
    const incDue =
      raw == null || raw === ""
        ? null
        : String(raw).trim() === ""
          ? null
          : String(raw).slice(0, 10);
    const saved = await incompleteGrades.saveIncDueDateSetting(termId, campusId, incDue);
    res.json({ inc_due_date: saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save INC due date" });
  }
};

export const postStudentsWithIncompleteGradeConvert = async (req: Request, res: Response) => {
  try {
    const raw = req.body?.ids;
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(400).json({ error: "ids array required" });
    }
    const ids = raw
      .map((x) => parseInt(String(x), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (!ids.length) return res.status(400).json({ error: "valid ids required" });
    const failing = String(req.body?.failing_grade ?? req.body?.failingGrade ?? "5.00").trim() || "5.00";
    const remarks =
      req.body?.remarks_append == null && req.body?.remarksAppend == null
        ? null
        : String(req.body?.remarks_append ?? req.body?.remarksAppend ?? "").trim() || null;
    const affected = await incompleteGrades.convertIncToFailing(ids, failing, remarks);
    res.json({ affected });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to convert grades" });
  }
};

/* --- Recalculate summary of grades --- */

export const getRecalculateSummaryOfGrades = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    const collegeCode = String(req.query.collegeCode ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    if (campusId == null) return res.status(400).json({ error: "campusId query required" });
    if (!collegeCode) return res.status(400).json({ error: "collegeCode query required" });
    const rows = await summaryRecalc.listStudentGradeSummaries(termId, campusId, collegeCode);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load grade summaries" });
  }
};

export const postRecalculateSummaryOfGrades = async (req: Request, res: Response) => {
  try {
    const idsRaw = req.body?.ids;
    const ids = Array.isArray(idsRaw)
      ? idsRaw.map((x) => parseInt(String(x), 10)).filter((n) => Number.isFinite(n) && n > 0)
      : [];
    const allInFilterRaw = req.body?.allInFilter ?? req.body?.all_in_filter;
    const useAll = !ids.length && allInFilterRaw && typeof allInFilterRaw === "object";
    if (!ids.length && !useAll) {
      return res.status(400).json({ error: "Provide ids[] or allInFilter" });
    }
    let allFilter: { academicYearTermId: number; campusId: number; collegeCode: string } | undefined;
    if (useAll) {
      const allInFilter = allInFilterRaw as Record<string, unknown>;
      const tid = parseIntParam(allInFilter.academicYearTermId ?? allInFilter.academic_year_term_id, "term");
      const cid = parseIntParam(allInFilter.campusId ?? allInFilter.campus_id, "campus");
      const cc = String(allInFilter.collegeCode ?? allInFilter.college_code ?? "").trim();
      if (tid == null || cid == null || !cc) {
        return res.status(400).json({ error: "allInFilter needs academicYearTermId, campusId, collegeCode" });
      }
      allFilter = { academicYearTermId: tid, campusId: cid, collegeCode: cc };
    }
    const gradeLevel = String(req.body?.gradeLevel ?? req.body?.grade_level ?? "College").trim() || "College";
    const formatKey = String(req.body?.format ?? req.body?.formatKey ?? "format_1").trim() || "format_1";
    const recomputeAllTerms = Boolean(req.body?.recomputeAllTerms ?? req.body?.recompute_all_terms);
    const out = await summaryRecalc.recalculateStudentGradeSummaries({
      ids: ids.length ? ids : undefined,
      allInFilter: allFilter,
      recomputeAllTerms,
      gradeLevel,
      formatKey,
    });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to recalculate summaries" });
  }
};

/* --- Grade encoding --- */

export const getGradeEncoding = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const studentNo = String(req.query.studentNo ?? "").trim();
    const gradeLevel = String(req.query.gradeLevel ?? req.query.grade_level ?? "College").trim() || "College";
    const formatKey = String(req.query.format ?? req.query.formatKey ?? "format_1").trim() || "format_1";
    if (termId == null) return res.status(400).json({ error: "academicYearTermId query required" });
    if (!studentNo) return res.status(400).json({ error: "studentNo query required" });
    const data = await gradeEncoding.getGradeEncodingWorkspace(termId, studentNo, { gradeLevel, formatKey });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load grade encoding" });
  }
};

export const putGradeEncoding = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const studentNo = String(req.body?.student_no ?? req.body?.studentNo ?? "").trim();
    const raw = req.body?.rows;
    if (termId == null) return res.status(400).json({ error: "academic_year_term_id required" });
    if (!studentNo) return res.status(400).json({ error: "student_no required" });
    if (!Array.isArray(raw)) return res.status(400).json({ error: "rows array required" });
    const optStr = (v: unknown) => {
      if (v == null) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };
    const optNum = (v: unknown) => {
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const rows: gradeEncoding.GradeEncodingLineInput[] = raw.map((r: Record<string, unknown>) => ({
      course_code: optStr(r.course_code ?? r.courseCode),
      course_title: optStr(r.course_title ?? r.courseTitle),
      class_section: optStr(r.class_section ?? r.classSection),
      unit: optNum(r.unit),
      midterm: optStr(r.midterm),
      final: optStr(r.final),
      re_exam: optStr(r.re_exam ?? r.reExam),
      credited_units: optNum(r.credited_units ?? r.creditedUnits),
      remark: optStr(r.remark),
      year_level: optStr(r.year_level ?? r.yearLevel),
      from_other_school: Boolean(r.from_other_school ?? r.fromOtherSchool),
      date_entered: optStr(r.date_entered ?? r.dateEntered),
      date_posted: optStr(r.date_posted ?? r.datePosted),
      subject_id: optStr(r.subject_id ?? r.subjectId),
      grade_id: optStr(r.grade_id ?? r.gradeId),
      type_of_grade: optStr(r.type_of_grade ?? r.typeOfGrade),
      compute_gwa: r.compute_gwa === undefined && r.computeGwa === undefined ? true : Boolean(r.compute_gwa ?? r.computeGwa),
      registration_id: optStr(r.registration_id ?? r.registrationId),
      status: optStr(r.status),
      sort_order: optNum(r.sort_order ?? r.sortOrder),
    }));
    const gradeLevel = String(req.body?.gradeLevel ?? req.body?.grade_level ?? "College").trim() || "College";
    const formatKey = String(req.body?.format ?? req.body?.formatKey ?? "format_1").trim() || "format_1";
    const out = await gradeEncoding.saveGradeEncodingWorkspace(termId, studentNo, rows, { gradeLevel, formatKey });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save grade encoding" });
  }
};

export const putGradeEncodingEvaluation = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const studentNo = String(req.body?.student_no ?? req.body?.studentNo ?? "").trim();
    const raw = req.body?.rows;
    if (!studentNo) return res.status(400).json({ error: "student_no required" });
    if (!Array.isArray(raw)) return res.status(400).json({ error: "rows array required" });
    const optStr = (v: unknown) => {
      if (v == null) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };
    const optNum = (v: unknown) => {
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const rows: gradeEncoding.EvaluationLineInput[] = raw.map((r: Record<string, unknown>) => ({
      year_term: optStr(r.year_term ?? r.yearTerm),
      course_code: optStr(r.course_code ?? r.courseCode),
      course_title: optStr(r.course_title ?? r.courseTitle),
      unit: optNum(r.unit),
      final: optStr(r.final),
      re_exam: optStr(r.re_exam ?? r.reExam),
      credited_units: optNum(r.credited_units ?? r.creditedUnits),
      remarks: optStr(r.remarks ?? r.remark),
      pre_requisites: optStr(r.pre_requisites ?? r.preRequisites),
      equivalent: optStr(r.equivalent),
      year_standing: optStr(r.year_standing ?? r.yearStanding),
      academic_year_term_taken: optStr(r.academic_year_term_taken ?? r.academicYearTermTaken),
      year_level_taken: optStr(r.year_level_taken ?? r.yearLevelTaken),
      from_other_school: Boolean(r.from_other_school ?? r.fromOtherSchool),
      date_entered: optStr(r.date_entered ?? r.dateEntered),
      date_posted: optStr(r.date_posted ?? r.datePosted),
      sort_order: optNum(r.sort_order ?? r.sortOrder),
    }));
    const gradeLevel = String(req.body?.gradeLevel ?? req.body?.grade_level ?? "College").trim() || "College";
    const formatKey = String(req.body?.format ?? req.body?.formatKey ?? "format_1").trim() || "format_1";
    const out = await gradeEncoding.saveEvaluationLines(studentNo, rows, {
      academicYearTermId: termId ?? undefined,
      gradeLevel,
      formatKey,
    });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save evaluation" });
  }
};

export const putGradeEncodingSettings = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const studentNo = String(req.body?.student_no ?? req.body?.studentNo ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (!studentNo) return res.status(400).json({ error: "student_no required" });
    const includeSummer = Boolean(req.body?.include_summer ?? req.body?.includeSummer);
    const gradeLevel = String(req.body?.gradeLevel ?? req.body?.grade_level ?? "College").trim() || "College";
    const formatKey = String(req.body?.format ?? req.body?.formatKey ?? "format_1").trim() || "format_1";
    const out = await gradeEncoding.saveIncludeSummerSetting(studentNo, includeSummer, {
      academicYearTermId: termId,
      gradeLevel,
      formatKey,
    });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save settings" });
  }
};

/* --- Report of grades --- */

export const getReportOfGradesOptions = async (_req: Request, res: Response) => {
  try {
    res.json(reportOfGrades.getReportOptions());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load report options" });
  }
};

export const getReportOfGradesStudents = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    const q = String(req.query.q ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    if (!q) return res.json([]);
    const rows = await reportOfGrades.searchReportStudents({ academicYearTermId: termId, campusId, q });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Student search failed" });
  }
};

export const postReportOfGradesPreview = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academicYearTermId ?? req.body?.academic_year_term_id, "term");
    const campusId = parseIntParam(req.body?.campusId ?? req.body?.campus_id, "campus");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });

    const layout = String(req.body?.layout ?? "final_grade").trim() || "final_grade";
    const includeSummer = Boolean(req.body?.includeSummer ?? req.body?.include_summer);
    const termScope = String(req.body?.termScope ?? req.body?.term_scope ?? "all").toLowerCase() === "selected" ? "selected" : "all";

    const rawNos = req.body?.studentNos ?? req.body?.student_nos;
    let studentNos: string[] = Array.isArray(rawNos)
      ? rawNos.map((x) => String(x).trim()).filter(Boolean)
      : [];

    if (!studentNos.length) {
      const mode = String(req.body?.mode ?? "bulk").toLowerCase();
      if (mode === "individual") {
        return res.status(400).json({ error: "Select at least one student for individual printing" });
      }
      const resolved = await reportOfGrades.resolveReportStudents({
        academicYearTermId: termId,
        campusId,
        collegeCode: String(req.body?.collegeCode ?? req.body?.college_code ?? "").trim() || undefined,
        program: String(req.body?.program ?? "").trim() || undefined,
        yearLevel: String(req.body?.yearLevel ?? req.body?.year_level ?? "").trim() || undefined,
        sortBy: String(req.body?.sortBy ?? req.body?.sort_by ?? "name").trim() || "name",
      });
      studentNos = resolved.map((r) => r.student_no);
    }

    if (!studentNos.length) {
      return res.status(400).json({ error: "No students matched the selected filters" });
    }

    const preview = await reportOfGrades.buildReportPreview({
      academicYearTermId: termId,
      campusId,
      layout,
      studentNos,
      includeSummer,
      termScope,
    });
    res.json(preview);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to build report preview" });
  }
};

/* --- Grade point average ranking --- */

export const getGradePointAverageRankingOptions = async (_req: Request, res: Response) => {
  try {
    res.json(gpaRanking.getGpaRankingOptions());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load GPA ranking options" });
  }
};

export const getGradePointAverageRankingStudents = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    const q = String(req.query.q ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    if (!q) return res.json([]);
    const rows = await gpaRanking.searchReportStudents({ academicYearTermId: termId, campusId, q });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Student search failed" });
  }
};

export const postGradePointAverageRankingPreview = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academicYearTermId ?? req.body?.academic_year_term_id, "term");
    const campusId = parseIntParam(req.body?.campusId ?? req.body?.campus_id, "campus");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });

    const reportKey = String(req.body?.reportKey ?? req.body?.report_key ?? "gwa_layout_1").trim() || "gwa_layout_1";
    const sortBy = String(req.body?.sortBy ?? req.body?.sort_by ?? "rank").trim() || "rank";
    const withCondition = Boolean(req.body?.withCondition ?? req.body?.with_condition);
    const conditionField = String(req.body?.conditionField ?? req.body?.condition_field ?? "").trim();
    const conditionValue = String(req.body?.conditionValue ?? req.body?.condition_value ?? "").trim();

    const rawNos = req.body?.studentNos ?? req.body?.student_nos;
    let studentNos: string[] = Array.isArray(rawNos)
      ? rawNos.map((x) => String(x).trim()).filter(Boolean)
      : [];

    if (!studentNos.length) {
      const mode = String(req.body?.mode ?? "bulk").toLowerCase();
      if (mode === "individual") {
        return res.status(400).json({ error: "Select at least one student for individual printing" });
      }
      const allGroups = Boolean(req.body?.allGroups ?? req.body?.all_groups);
      const resolved = await gpaRanking.resolveGpaStudents({
        academicYearTermId: termId,
        campusId,
        allGroups,
        collegeCode: String(req.body?.collegeCode ?? req.body?.college_code ?? "").trim() || undefined,
        program: String(req.body?.program ?? "").trim() || undefined,
        majorStudy: String(req.body?.majorStudy ?? req.body?.major_study ?? "").trim() || undefined,
        yearLevel: String(req.body?.yearLevel ?? req.body?.year_level ?? "").trim() || undefined,
        sortBy,
      });
      studentNos = resolved.map((r) => r.student_no);
    }

    if (!studentNos.length) {
      return res.status(400).json({ error: "No students matched the selected filters" });
    }

    const preview = await gpaRanking.buildGpaRankingPreview({
      academicYearTermId: termId,
      campusId,
      reportKey,
      studentNos,
      sortBy,
      withCondition,
      conditionField,
      conditionValue,
    });
    res.json(preview);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to build GPA listing preview" });
  }
};

/* --- Worksheet for consolidated grades --- */

export const getWorksheetForConsolidatedGradesOptions = async (_req: Request, res: Response) => {
  try {
    res.json(worksheetGrades.getWorksheetOptions());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load worksheet options" });
  }
};

export const postWorksheetForConsolidatedGradesPreview = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academicYearTermId ?? req.body?.academic_year_term_id, "term");
    const campusId = parseIntParam(req.body?.campusId ?? req.body?.campus_id, "campus");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });

    const layout = String(req.body?.layout ?? "default").trim() || "default";
    const byCollege = Boolean(req.body?.byCollege ?? req.body?.by_college);
    const byProgram = Boolean(req.body?.byProgram ?? req.body?.by_program);

    if (byCollege && !String(req.body?.collegeCode ?? req.body?.college_code ?? "").trim()) {
      return res.status(400).json({ error: "Select a college when filtering by college" });
    }
    if (byProgram && !String(req.body?.program ?? "").trim()) {
      return res.status(400).json({ error: "Select a program when filtering by program" });
    }

    const preview = await worksheetGrades.buildWorksheetPreview({
      academicYearTermId: termId,
      campusId,
      layout,
      collegeCode: byCollege
        ? String(req.body?.collegeCode ?? req.body?.college_code ?? "").trim() || undefined
        : undefined,
      program: byProgram ? String(req.body?.program ?? "").trim() || undefined : undefined,
      yearLevel: String(req.body?.yearLevel ?? req.body?.year_level ?? "").trim() || undefined,
      sortBy: String(req.body?.sortBy ?? req.body?.sort_by ?? "name").trim() || "name",
    });
    res.json(preview);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to build worksheet preview" });
  }
};

/* --- Tag graduating students --- */

export const getTagGraduatingStudentsOptions = async (_req: Request, res: Response) => {
  try {
    res.json(tagGraduating.getTagGraduatingOptions());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load options" });
  }
};

export const getTagGraduatingStudentsList = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    const rows = await tagGraduating.listTaggedStudents({ academicYearTermId: termId, campusId });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load list" });
  }
};

export const getTagGraduatingStudentWorkspace = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    const studentNo = String(req.query.studentNo ?? req.query.student_no ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    if (!studentNo) return res.status(400).json({ error: "studentNo required" });
    const data = await tagGraduating.getStudentTagWorkspace({
      academicYearTermId: termId,
      campusId,
      studentNo,
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load student" });
  }
};

export const getTagGraduatingStudentsSearch = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    const q = String(req.query.q ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    if (!q) return res.json([]);
    const rows = await tagGraduating.searchReportStudents({ academicYearTermId: termId, campusId, q });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Student search failed" });
  }
};

export const getTagGraduatingMassCandidates = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    const rows = await tagGraduating.listMassCandidates({
      academicYearTermId: termId,
      campusId,
      collegeCode: String(req.query.collegeCode ?? req.query.college_code ?? "").trim() || undefined,
      program: String(req.query.program ?? "").trim() || undefined,
      yearLevel: String(req.query.yearLevel ?? req.query.year_level ?? "").trim() || undefined,
    });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load candidates" });
  }
};

export const postTagGraduatingStudent = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academicYearTermId ?? req.body?.academic_year_term_id, "term");
    const campusId = parseIntParam(req.body?.campusId ?? req.body?.campus_id, "campus");
    const studentNo = String(req.body?.studentNo ?? req.body?.student_no ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    if (!studentNo) return res.status(400).json({ error: "studentNo required" });

    const row = await tagGraduating.saveGraduatingTag({
      academicYearTermId: termId,
      campusId,
      studentNo,
      dateEntry: String(req.body?.dateEntry ?? req.body?.date_entry ?? "").trim() || undefined,
      graduationFeeTemplate:
        String(req.body?.graduationFeeTemplate ?? req.body?.graduation_fee_template ?? "").trim() || undefined,
      remarks: String(req.body?.remarks ?? "").trim() || undefined,
      graduationApplicationApproved: Boolean(
        req.body?.graduationApplicationApproved ?? req.body?.graduation_application_approved
      ),
      majorStudy: String(req.body?.majorStudy ?? req.body?.major_study ?? "").trim() || undefined,
    });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save tag" });
  }
};

export const postTagGraduatingStudentVoid = async (req: Request, res: Response) => {
  try {
    const id = parseIntParam(req.body?.id, "id");
    if (id == null) return res.status(400).json({ error: "id required" });
    await tagGraduating.voidGraduatingTag(id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to void tag" });
  }
};

export const postTagGraduatingStudentsMass = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academicYearTermId ?? req.body?.academic_year_term_id, "term");
    const campusId = parseIntParam(req.body?.campusId ?? req.body?.campus_id, "campus");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });

    const raw = req.body?.studentNos ?? req.body?.student_nos;
    const studentNos: string[] = Array.isArray(raw)
      ? raw.map((x) => String(x).trim()).filter(Boolean)
      : [];
    if (!studentNos.length) {
      return res.status(400).json({ error: "Select at least one student" });
    }

    const result = await tagGraduating.massTagGraduatingStudents({
      academicYearTermId: termId,
      campusId,
      studentNos,
      graduationFeeTemplate:
        String(req.body?.graduationFeeTemplate ?? req.body?.graduation_fee_template ?? "").trim() || undefined,
      remarks: String(req.body?.remarks ?? "").trim() || undefined,
      graduationApplicationApproved: Boolean(
        req.body?.graduationApplicationApproved ?? req.body?.graduation_application_approved
      ),
    });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Mass tagging failed" });
  }
};

/* --- Graduate / candidates for graduation --- */

export const getGraduateCandidatesForGraduation = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });

    const collegeRaw = String(req.query.collegeCode ?? req.query.college_code ?? "").trim();
    const programRaw = String(req.query.program ?? "").trim();
    const expandGroups =
      String(req.query.expandGroups ?? req.query.expand_groups ?? "").toLowerCase() === "true" ||
      req.query.expandGroups === "1";

    const data = await graduateCandidates.listGraduateCandidates({
      academicYearTermId: termId,
      campusId,
      collegeCode: collegeRaw && !/^all$/i.test(collegeRaw) ? collegeRaw : undefined,
      program: programRaw && !/^all$/i.test(programRaw) ? programRaw : undefined,
      expandGroups,
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load graduates list" });
  }
};

/* --- Certification --- */

export const getCertificationOptions = async (_req: Request, res: Response) => {
  try {
    res.json(certification.getCertificationOptions());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load options" });
  }
};

export const getCertificationStudents = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    const q = String(req.query.q ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    if (!q) return res.json([]);
    const rows = await certification.searchReportStudents({ academicYearTermId: termId, campusId, q });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Student search failed" });
  }
};

export const getCertificationStudent = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.query.academicYearTermId, "academicYearTermId");
    const campusId = parseIntParam(req.query.campusId, "campusId");
    const studentNo = String(req.query.studentNo ?? req.query.student_no ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    if (!studentNo) return res.status(400).json({ error: "studentNo required" });
    const data = await certification.getCertificationStudent({
      academicYearTermId: termId,
      campusId,
      studentNo,
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load student" });
  }
};

export const getCertificationSignatories = async (req: Request, res: Response) => {
  try {
    const certificateType = String(req.query.certificateType ?? req.query.certificate_type ?? "enrolment").trim();
    const rows = await certification.listSignatories(certificateType);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load signatories" });
  }
};

export const putCertificationSignatories = async (req: Request, res: Response) => {
  try {
    const certificateType = String(req.body?.certificateType ?? req.body?.certificate_type ?? "enrolment").trim();
    const raw = req.body?.rows ?? req.body?.signatories;
    if (!Array.isArray(raw)) return res.status(400).json({ error: "rows array required" });
    const rows = await certification.saveSignatories(
      certificateType,
      raw.map((r: Record<string, unknown>, i: number) => ({
        signatory_name: String(r.signatory_name ?? r.signatoryName ?? ""),
        signatory_title: String(r.signatory_title ?? r.signatoryTitle ?? ""),
        sort_order: Number(r.sort_order ?? r.sortOrder ?? i),
      }))
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save signatories" });
  }
};

export const getCertificationPrintHistory = async (req: Request, res: Response) => {
  try {
    const studentNo = String(req.query.studentNo ?? req.query.student_no ?? "").trim();
    if (!studentNo) return res.status(400).json({ error: "studentNo required" });
    const rows = await certification.listPrintHistory(studentNo);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load print history" });
  }
};

export const postCertificationPreview = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academicYearTermId ?? req.body?.academic_year_term_id, "term");
    const campusId = parseIntParam(req.body?.campusId ?? req.body?.campus_id, "campus");
    const studentNo = String(req.body?.studentNo ?? req.body?.student_no ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    if (!studentNo) return res.status(400).json({ error: "studentNo required" });

    const rawTermIds = req.body?.termIds ?? req.body?.term_ids;
    const termIds: number[] = Array.isArray(rawTermIds)
      ? rawTermIds.map((x) => parseInt(String(x), 10)).filter((n) => Number.isFinite(n) && n > 0)
      : [];

    const preview = await certification.buildCertificationPreview({
      academicYearTermId: termId,
      campusId,
      studentNo,
      certificateType: String(req.body?.certificateType ?? req.body?.certificate_type ?? "enrolment").trim(),
      termIds,
      orNo: String(req.body?.orNo ?? req.body?.or_no ?? "").trim(),
      issuedTo: String(req.body?.issuedTo ?? req.body?.issued_to ?? "").trim(),
      issuedOn: String(req.body?.issuedOn ?? req.body?.issued_on ?? "").trim(),
      dateRequest: String(req.body?.dateRequest ?? req.body?.date_request ?? "").trim(),
      dateRelease: String(req.body?.dateRelease ?? req.body?.date_release ?? "").trim(),
      purposeKey: String(req.body?.purposeKey ?? req.body?.purpose_key ?? "").trim(),
      purposeRemarks: String(req.body?.purposeRemarks ?? req.body?.purpose_remarks ?? "").trim(),
      includeCreditedCourses: Boolean(req.body?.includeCreditedCourses ?? req.body?.include_credited_courses),
      includeSummerCgpa: Boolean(req.body?.includeSummerCgpa ?? req.body?.include_summer_cgpa),
      includeOtherSchoolGrades: Boolean(
        req.body?.includeOtherSchoolGrades ?? req.body?.include_other_school_grades
      ),
      finalCopy: Boolean(req.body?.finalCopy ?? req.body?.final_copy),
    });
    res.json(preview);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to build preview" });
  }
};

export const postCertificationPrint = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academicYearTermId ?? req.body?.academic_year_term_id, "term");
    const campusId = parseIntParam(req.body?.campusId ?? req.body?.campus_id, "campus");
    const studentNo = String(req.body?.studentNo ?? req.body?.student_no ?? "").trim();
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });
    if (!studentNo) return res.status(400).json({ error: "studentNo required" });

    const rawTermIds = req.body?.termIds ?? req.body?.term_ids;
    const termIds: number[] = Array.isArray(rawTermIds)
      ? rawTermIds.map((x) => parseInt(String(x), 10)).filter((n) => Number.isFinite(n) && n > 0)
      : [];

    const certificateType = String(req.body?.certificateType ?? req.body?.certificate_type ?? "enrolment").trim();
    const preview = await certification.buildCertificationPreview({
      academicYearTermId: termId,
      campusId,
      studentNo,
      certificateType,
      termIds,
      orNo: String(req.body?.orNo ?? req.body?.or_no ?? "").trim(),
      issuedTo: String(req.body?.issuedTo ?? req.body?.issued_to ?? "").trim(),
      issuedOn: String(req.body?.issuedOn ?? req.body?.issued_on ?? "").trim(),
      dateRequest: String(req.body?.dateRequest ?? req.body?.date_request ?? "").trim(),
      dateRelease: String(req.body?.dateRelease ?? req.body?.date_release ?? "").trim(),
      purposeKey: String(req.body?.purposeKey ?? req.body?.purpose_key ?? "").trim(),
      purposeRemarks: String(req.body?.purposeRemarks ?? req.body?.purpose_remarks ?? "").trim(),
      includeCreditedCourses: Boolean(req.body?.includeCreditedCourses ?? req.body?.include_credited_courses),
      includeSummerCgpa: Boolean(req.body?.includeSummerCgpa ?? req.body?.include_summer_cgpa),
      includeOtherSchoolGrades: Boolean(
        req.body?.includeOtherSchoolGrades ?? req.body?.include_other_school_grades
      ),
      finalCopy: Boolean(req.body?.finalCopy ?? req.body?.final_copy),
    });

    const history = await certification.recordPrintHistory({
      studentNo,
      certificateType,
      orNo: String(req.body?.orNo ?? req.body?.or_no ?? "").trim(),
      issuedTo: String(req.body?.issuedTo ?? req.body?.issued_to ?? "").trim(),
      issuedOn: String(req.body?.issuedOn ?? req.body?.issued_on ?? "").trim(),
      dateRequest: String(req.body?.dateRequest ?? req.body?.date_request ?? "").trim(),
      dateRelease: String(req.body?.dateRelease ?? req.body?.date_release ?? "").trim(),
      purposeKey: String(req.body?.purposeKey ?? req.body?.purpose_key ?? "").trim(),
      purposeRemarks: String(req.body?.purposeRemarks ?? req.body?.purpose_remarks ?? "").trim(),
      finalCopy: Boolean(req.body?.finalCopy ?? req.body?.final_copy),
      payload: preview,
    });

    res.json({ preview, history });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Print failed" });
  }
};

/* --- CHED reports --- */

export const getChedReportsOptions = async (_req: Request, res: Response) => {
  try {
    res.json(chedReports.getChedReportOptions());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load CHED report options" });
  }
};

export const postChedReportsPreview = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academicYearTermId ?? req.body?.academic_year_term_id, "term");
    const campusId = parseIntParam(req.body?.campusId ?? req.body?.campus_id, "campus");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });

    const preview = await chedReports.buildChedReportPreview({
      academicYearTermId: termId,
      campusId,
      level: String(req.body?.level ?? "college").trim() || "college",
      reportKey: String(req.body?.reportKey ?? req.body?.report_key ?? "institution_profile").trim(),
    });
    res.json(preview);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to build CHED report preview" });
  }
};

/* --- List of reports --- */

export const getListOfReportsOptions = async (_req: Request, res: Response) => {
  try {
    res.json(listOfReports.getListOfReportsOptions());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to load report options" });
  }
};

export const postListOfReportsPreview = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academicYearTermId ?? req.body?.academic_year_term_id, "term");
    const campusId = parseIntParam(req.body?.campusId ?? req.body?.campus_id, "campus");
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (campusId == null) return res.status(400).json({ error: "campusId required" });

    const allGroups = Boolean(req.body?.allGroups ?? req.body?.all_groups);
    const byCollege = Boolean(req.body?.byCollege ?? req.body?.by_college);
    const byProgram = Boolean(req.body?.byProgram ?? req.body?.by_program);

    const preview = await listOfReports.buildListOfReportsPreview({
      academicYearTermId: termId,
      campusId,
      category: String(req.body?.category ?? "graduate_school").trim() || "graduate_school",
      reportKey: String(req.body?.reportKey ?? req.body?.report_key ?? "official_enrollment_list").trim(),
      collegeCode:
        !allGroups && byCollege
          ? String(req.body?.collegeCode ?? req.body?.college_code ?? "").trim() || undefined
          : undefined,
      program:
        !allGroups && byProgram ? String(req.body?.program ?? "").trim() || undefined : undefined,
      majorStudy: String(req.body?.majorStudy ?? req.body?.major_study ?? "").trim() || undefined,
      yearLevel: String(req.body?.yearLevel ?? req.body?.year_level ?? "").trim() || undefined,
      sortBy: String(req.body?.sortBy ?? req.body?.sort_by ?? "name").trim() || "name",
    });
    res.json(preview);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to build report preview" });
  }
};

export const putGradeEncodingTranscript = async (req: Request, res: Response) => {
  try {
    const termId = parseIntParam(req.body?.academic_year_term_id ?? req.body?.academicYearTermId, "term");
    const studentNo = String(req.body?.student_no ?? req.body?.studentNo ?? "").trim();
    const raw = req.body?.flags ?? req.body?.rows;
    if (termId == null) return res.status(400).json({ error: "academicYearTermId required" });
    if (!studentNo) return res.status(400).json({ error: "student_no required" });
    if (!Array.isArray(raw)) return res.status(400).json({ error: "flags array required" });
    const flags: gradeEncoding.TranscriptFlagInput[] = raw.map((r: Record<string, unknown>) => ({
      id: parseInt(String(r.id), 10),
      show_in_tor: r.show_in_tor == null && r.showInTor == null ? null : Boolean(r.show_in_tor ?? r.showInTor),
      not_credited:
        r.not_credited == null && r.notCredited == null ? null : Boolean(r.not_credited ?? r.notCredited),
    }));
    const gradeLevel = String(req.body?.gradeLevel ?? req.body?.grade_level ?? "College").trim() || "College";
    const formatKey = String(req.body?.format ?? req.body?.formatKey ?? "format_1").trim() || "format_1";
    const out = await gradeEncoding.saveTranscriptFlags(studentNo, flags, {
      academicYearTermId: termId,
      gradeLevel,
      formatKey,
    });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to save transcript flags" });
  }
};
