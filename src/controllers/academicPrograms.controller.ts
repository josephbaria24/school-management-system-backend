import { Request, Response } from "express";
import * as svc from "../services/academicPrograms.service.js";

function normalizeProgramBody(body: Record<string, unknown>) {
  const n = (v: unknown) => {
    if (v === "" || v === undefined || v === null) return null;
    const x = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(x) ? x : null;
  };
  const ni = (v: unknown) => {
    if (v === "" || v === undefined || v === null) return null;
    const x = typeof v === "string" ? parseInt(v, 10) : Number(v);
    return Number.isFinite(x) ? x : null;
  };
  const d = (v: unknown) =>
    v && String(v).trim() ? String(v).trim() : null;
  return {
    campus_id: ni(body.campus_id),
    college_id: ni(body.college_id),
    program_code: String(body.program_code ?? "").trim(),
    program_name: String(body.program_name ?? "").trim(),
    short_name: d(body.short_name),
    admission_number_code: d(body.admission_number_code),
    status: body.status ? String(body.status) : "active",
    term: d(body.term),
    program_alias: !!body.program_alias,
    no_of_years: ni(body.no_of_years),
    max_residency: ni(body.max_residency),
    total_academic_subjects: ni(body.total_academic_subjects),
    total_academic_credit_units: n(body.total_academic_credit_units),
    academic_program_weight: n(body.academic_program_weight),
    total_ge_units: n(body.total_ge_units),
    total_major_units: n(body.total_major_units),
    total_elective_units: n(body.total_elective_units),
    total_lecture_units: n(body.total_lecture_units),
    total_non_lecture_units: n(body.total_non_lecture_units),
    classification: d(body.classification),
    thesis_option: d(body.thesis_option),
    board_exam: d(body.board_exam),
    ladder: d(body.ladder),
    parent_program: d(body.parent_program),
    date_recognized: d(body.date_recognized),
    date_revised: d(body.date_revised),
  };
}

export const getAll = async (req: Request, res: Response) => {
  try {
    const collegeId = req.query.college_id
      ? parseInt(String(req.query.college_id), 10)
      : undefined;
    const rows = await svc.getAllAcademicPrograms(collegeId);
    res.json(rows);
  } catch (err) {
    console.error("academicPrograms:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const row = await svc.getAcademicProgramById(
      parseInt(String(req.params.id), 10)
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("academicPrograms:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data = normalizeProgramBody(req.body as Record<string, unknown>);
    if (
      !Number.isFinite(data.campus_id as number) ||
      !Number.isFinite(data.college_id as number) ||
      !data.program_code ||
      !data.program_name
    ) {
      return res.status(400).json({
        error: "Campus, college, program code, and program name are required",
      });
    }
    const row = await svc.createAcademicProgram(data as Record<string, unknown>);
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("academicPrograms:", err);
    if (e?.code === "23505") {
      return res
        .status(409)
        .json({ error: "Program code already exists for this college" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const data = normalizeProgramBody(req.body as Record<string, unknown>);
    if (
      !Number.isFinite(data.campus_id as number) ||
      !Number.isFinite(data.college_id as number) ||
      !data.program_code ||
      !data.program_name
    ) {
      return res.status(400).json({
        error: "Campus, college, program code, and program name are required",
      });
    }
    const row = await svc.updateAcademicProgram(
      id,
      data as Record<string, unknown>
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("academicPrograms:", err);
    if (e?.code === "23505") {
      return res
        .status(409)
        .json({ error: "Program code already exists for this college" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const row = await svc.deleteAcademicProgram(
      parseInt(String(req.params.id), 10)
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("academicPrograms:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
