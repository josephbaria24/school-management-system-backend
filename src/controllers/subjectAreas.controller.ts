import { Request, Response } from "express";
import * as svc from "../services/subjectAreas.service.js";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getAllSubjectAreas();
    res.json(rows);
  } catch (err) {
    console.error("subjectAreas getAll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const row = await svc.getSubjectAreaById(parseInt(String(req.params.id), 10));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("subjectAreas getById:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const area_code = parseInt(String(req.body.area_code ?? ""), 10);
    const area_name = String(req.body.area_name ?? "").trim();
    const short_raw = String(req.body.short_name ?? "").trim();
    if (!Number.isFinite(area_code)) {
      return res.status(400).json({ error: "Subject area code is required" });
    }
    if (!area_name) {
      return res.status(400).json({ error: "Subject area name is required" });
    }
    const row = await svc.createSubjectArea({
      area_code,
      area_name,
      short_name: short_raw || null,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("subjectAreas create:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Subject area code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const area_code = parseInt(String(req.body.area_code ?? ""), 10);
    const area_name = String(req.body.area_name ?? "").trim();
    const short_raw = String(req.body.short_name ?? "").trim();
    if (!Number.isFinite(area_code)) {
      return res.status(400).json({ error: "Subject area code is required" });
    }
    if (!area_name) {
      return res.status(400).json({ error: "Subject area name is required" });
    }
    const row = await svc.updateSubjectArea(id, {
      area_code,
      area_name,
      short_name: short_raw || null,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("subjectAreas update:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Subject area code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const row = await svc.deleteSubjectArea(parseInt(String(req.params.id), 10));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("subjectAreas delete:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
