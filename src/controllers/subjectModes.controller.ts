import { Request, Response } from "express";
import * as svc from "../services/subjectModes.service.js";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getAllSubjectModes();
    res.json(rows);
  } catch (err) {
    console.error("subjectModes getAll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const row = await svc.getSubjectModeById(parseInt(String(req.params.id), 10));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("subjectModes getById:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const mode_code = parseInt(String(req.body.mode_code ?? ""), 10);
    const mode_name = String(req.body.mode_name ?? "").trim();
    const short_raw = String(req.body.short_name ?? "").trim();
    if (!Number.isFinite(mode_code)) {
      return res.status(400).json({ error: "Subject mode code is required" });
    }
    if (!mode_name) {
      return res.status(400).json({ error: "Subject mode name is required" });
    }
    const row = await svc.createSubjectMode({
      mode_code,
      mode_name,
      short_name: short_raw || null,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("subjectModes create:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Subject mode code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const mode_code = parseInt(String(req.body.mode_code ?? ""), 10);
    const mode_name = String(req.body.mode_name ?? "").trim();
    const short_raw = String(req.body.short_name ?? "").trim();
    if (!Number.isFinite(mode_code)) {
      return res.status(400).json({ error: "Subject mode code is required" });
    }
    if (!mode_name) {
      return res.status(400).json({ error: "Subject mode name is required" });
    }
    const row = await svc.updateSubjectMode(id, {
      mode_code,
      mode_name,
      short_name: short_raw || null,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("subjectModes update:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Subject mode code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const row = await svc.deleteSubjectMode(parseInt(String(req.params.id), 10));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("subjectModes delete:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
