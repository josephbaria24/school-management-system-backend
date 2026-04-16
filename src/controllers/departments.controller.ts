import { Request, Response } from "express";
import * as svc from "../services/departments.service.js";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getAllDepartments();
    res.json(rows);
  } catch (err) {
    console.error("departments getAll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const row = await svc.getDepartmentById(
      parseInt(String(req.params.id), 10)
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("departments getById:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function parseCollegeId(collegeRaw: unknown): number | null | "invalid" {
  if (
    collegeRaw === undefined ||
    collegeRaw === null ||
    collegeRaw === "" ||
    collegeRaw === "none"
  ) {
    return null;
  }
  const n = parseInt(String(collegeRaw), 10);
  return Number.isFinite(n) ? n : "invalid";
}

export const create = async (req: Request, res: Response) => {
  try {
    const campus_id = parseInt(String(req.body.campus_id), 10);
    const collegeParsed = parseCollegeId(req.body.college_id);
    if (collegeParsed === "invalid") {
      return res.status(400).json({ error: "Invalid college" });
    }
    const dept_code = String(req.body.dept_code ?? "").trim();
    const dept_name = String(req.body.dept_name ?? "").trim();
    if (!Number.isFinite(campus_id) || !dept_code || !dept_name) {
      return res.status(400).json({
        error: "Campus, department code, and department name are required",
      });
    }
    const row = await svc.createDepartment({
      campus_id,
      college_id: collegeParsed,
      dept_code,
      dept_name,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("departments create:", err);
    if (e?.code === "23505") {
      return res
        .status(409)
        .json({ error: "Department code already exists for this campus" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const campus_id = parseInt(String(req.body.campus_id), 10);
    const collegeParsed = parseCollegeId(req.body.college_id);
    if (collegeParsed === "invalid") {
      return res.status(400).json({ error: "Invalid college" });
    }
    const dept_code = String(req.body.dept_code ?? "").trim();
    const dept_name = String(req.body.dept_name ?? "").trim();
    if (!Number.isFinite(campus_id) || !dept_code || !dept_name) {
      return res.status(400).json({
        error: "Campus, department code, and department name are required",
      });
    }
    const row = await svc.updateDepartment(id, {
      campus_id,
      college_id: collegeParsed,
      dept_code,
      dept_name,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("departments update:", err);
    if (e?.code === "23505") {
      return res
        .status(409)
        .json({ error: "Department code already exists for this campus" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const row = await svc.deleteDepartment(
      parseInt(String(req.params.id), 10)
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("departments delete:", err);
    if (e?.code === "23503") {
      return res
        .status(409)
        .json({ error: "Cannot delete: assigned to an employee" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
