import { Request, Response } from "express";
import * as svc from "../services/coursesMasterList.service.js";

const n = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const x = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(x) ? x : null;
};

const ni = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const x = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(x) ? x : null;
};

const t = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s || null;
};

function normalizeBody(body: Record<string, unknown>) {
  return {
    course_code: String(body.course_code ?? "").trim(),
    course_title: String(body.course_title ?? "").trim(),
    course_description: t(body.course_description),
    laboratory_units: n(body.laboratory_units),
    academic_units_lecture: n(body.academic_units_lecture),
    credited_units: n(body.credited_units),
    lecture_hours: n(body.lecture_hours),
    laboratory_hours: n(body.laboratory_hours),
    general_education: !!body.general_education,
    major_course: !!body.major_course,
    elective_course: !!body.elective_course,
    computer_course: !!body.computer_course,
    e_learning: !!body.e_learning,
    course_with_internet: !!body.course_with_internet,
    include_in_gwa: !!body.include_in_gwa,
    non_academic_course: !!body.non_academic_course,
    club_organization_course: !!body.club_organization_course,
    from_other_school: !!body.from_other_school,
    use_transmuted_grade: !!body.use_transmuted_grade,
    is_inactive: !!body.is_inactive,
    code_alias_1: t(body.code_alias_1),
    code_alias_2: t(body.code_alias_2),
    parent_code: t(body.parent_code),
    course_level: t(body.course_level),
    course_area: t(body.course_area),
    course_mode: t(body.course_mode),
    default_min_class_limit: ni(body.default_min_class_limit),
    default_max_class_limit: ni(body.default_max_class_limit),
    is_locked_subject: !!body.is_locked_subject,
  };
}

export const getAll = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getAllCourses();
    res.json(rows);
  } catch (err) {
    console.error("coursesMasterList getAll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const row = await svc.getCourseById(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("coursesMasterList getById:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data = normalizeBody(req.body as Record<string, unknown>);
    if (!data.course_code || !data.course_title) {
      return res.status(400).json({ error: "Course code and course title are required" });
    }
    const row = await svc.createCourse(data);
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("coursesMasterList create:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Course code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const data = normalizeBody(req.body as Record<string, unknown>);
    if (!data.course_code || !data.course_title) {
      return res.status(400).json({ error: "Course code and course title are required" });
    }
    const row = await svc.updateCourse(id, data);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("coursesMasterList update:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Course code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const row = await svc.deleteCourse(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("coursesMasterList delete:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

