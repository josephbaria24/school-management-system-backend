import { Request, Response } from "express";
import * as svc from "../services/chedMajorDisciplines.service.js";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getAllChedMajorDisciplines();
    res.json(rows);
  } catch (err) {
    console.error("chedMajorDisciplines:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { major_code, major_discipline, major_group_id } = req.body;
    const gid = parseInt(String(major_group_id), 10);
    if (!major_code?.trim() || !major_discipline?.trim() || !Number.isFinite(gid)) {
      return res.status(400).json({
        error: "Major code, discipline name, and major group are required",
      });
    }
    const row = await svc.createChedMajorDiscipline({
      major_code: String(major_code),
      major_discipline: String(major_discipline),
      major_group_id: gid,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("chedMajorDisciplines:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Major code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { major_code, major_discipline, major_group_id } = req.body;
    const gid = parseInt(String(major_group_id), 10);
    if (!major_code?.trim() || !major_discipline?.trim() || !Number.isFinite(gid)) {
      return res.status(400).json({
        error: "Major code, discipline name, and major group are required",
      });
    }
    const row = await svc.updateChedMajorDiscipline(id, {
      major_code: String(major_code),
      major_discipline: String(major_discipline),
      major_group_id: gid,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("chedMajorDisciplines:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Major code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const row = await svc.deleteChedMajorDiscipline(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("chedMajorDisciplines:", err);
    if (e?.code === "23503") {
      return res
        .status(409)
        .json({ error: "Cannot delete: linked to an academic program" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
