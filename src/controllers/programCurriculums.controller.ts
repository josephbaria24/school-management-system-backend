import { Request, Response } from "express";
import * as svc from "../services/programCurriculums.service.js";

const toInt = (v: unknown) => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
};

const toNum = (v: unknown) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const toText = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

export const getCurriculums = async (req: Request, res: Response) => {
  try {
    const campus_id = req.query.campus_id ? toInt(req.query.campus_id) ?? undefined : undefined;
    const academic_program_id = req.query.academic_program_id
      ? toInt(req.query.academic_program_id) ?? undefined
      : undefined;
    const rows = await svc.getProgramCurriculums({ campus_id, academic_program_id });
    res.json(rows);
  } catch (err) {
    console.error("programCurriculums get:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCurriculumById = async (req: Request, res: Response) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const row = await svc.getProgramCurriculumById(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("programCurriculums getById:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function parseCurriculumPayload(body: Record<string, unknown>) {
  return {
    campus_id: toInt(body.campus_id),
    academic_program_id: toInt(body.academic_program_id),
    major_discipline_id: toInt(body.major_discipline_id),
    term_label: toText(body.term_label),
    no_of_years: toInt(body.no_of_years),
    total_terms: toInt(body.total_terms),
    curriculum_code: String(body.curriculum_code ?? "").trim(),
    description: toText(body.description),
    notes: toText(body.notes),
    is_locked: !!body.is_locked,
  };
}

export const createCurriculum = async (req: Request, res: Response) => {
  try {
    const data = parseCurriculumPayload(req.body as Record<string, unknown>);
    if (!data.campus_id || !data.academic_program_id || !data.curriculum_code) {
      return res.status(400).json({
        error: "Campus, academic program, and curriculum code are required",
      });
    }
    const row = await svc.createProgramCurriculum(data as never);
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("programCurriculums create:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Curriculum code already exists for this program" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateCurriculum = async (req: Request, res: Response) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const data = parseCurriculumPayload(req.body as Record<string, unknown>);
    if (!data.campus_id || !data.academic_program_id || !data.curriculum_code) {
      return res.status(400).json({
        error: "Campus, academic program, and curriculum code are required",
      });
    }
    const row = await svc.updateProgramCurriculum(id, data as never);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("programCurriculums update:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Curriculum code already exists for this program" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const removeCurriculum = async (req: Request, res: Response) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const row = await svc.deleteProgramCurriculum(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("programCurriculums delete:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const curriculumId = toInt(req.params.curriculumId);
    if (!curriculumId) return res.status(400).json({ error: "Invalid curriculum id" });
    const rows = await svc.getCurriculumSubjects(curriculumId);
    res.json(rows);
  } catch (err) {
    console.error("programCurriculums getSubjects:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function parseSubjectPayload(body: Record<string, unknown>) {
  return {
    subject_code: String(body.subject_code ?? "").trim(),
    descriptive_title: String(body.descriptive_title ?? "").trim(),
    lab_unit: toNum(body.lab_unit),
    lec_unit: toNum(body.lec_unit),
    credit_unit: toNum(body.credit_unit),
    lecture_hour: toNum(body.lecture_hour),
    laboratory_hour: toNum(body.laboratory_hour),
  };
}

export const createSubject = async (req: Request, res: Response) => {
  try {
    const curriculumId = toInt(req.params.curriculumId);
    if (!curriculumId) return res.status(400).json({ error: "Invalid curriculum id" });
    const data = parseSubjectPayload(req.body as Record<string, unknown>);
    if (!data.subject_code || !data.descriptive_title) {
      return res.status(400).json({ error: "Subject code and descriptive title are required" });
    }
    const row = await svc.createCurriculumSubject(curriculumId, data);
    res.status(201).json(row);
  } catch (err) {
    console.error("programCurriculums createSubject:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const id = toInt(req.params.subjectId);
    if (!id) return res.status(400).json({ error: "Invalid subject id" });
    const data = parseSubjectPayload(req.body as Record<string, unknown>);
    if (!data.subject_code || !data.descriptive_title) {
      return res.status(400).json({ error: "Subject code and descriptive title are required" });
    }
    const row = await svc.updateCurriculumSubject(id, data);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("programCurriculums updateSubject:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const removeSubject = async (req: Request, res: Response) => {
  try {
    const id = toInt(req.params.subjectId);
    if (!id) return res.status(400).json({ error: "Invalid subject id" });
    const row = await svc.deleteCurriculumSubject(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("programCurriculums removeSubject:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

