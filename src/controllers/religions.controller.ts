import { Request, Response } from "express";
import * as svc from "../services/religions.service.js";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getAllReligions();
    res.json(rows);
  } catch (err) {
    console.error("religions getAll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const row = await svc.getReligionById(parseInt(String(req.params.id), 10));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("religions getById:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const religion_name = String(req.body.religion_name ?? "").trim();
    const short_raw = String(req.body.short_name ?? "").trim();
    if (!religion_name) return res.status(400).json({ error: "Religion name is required" });
    const row = await svc.createReligion({
      religion_name,
      short_name: short_raw || null,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("religions create:", err);
    if (e?.code === "23505") return res.status(409).json({ error: "Religion already exists" });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const religion_name = String(req.body.religion_name ?? "").trim();
    const short_raw = String(req.body.short_name ?? "").trim();
    if (!religion_name) return res.status(400).json({ error: "Religion name is required" });
    const row = await svc.updateReligion(id, {
      religion_name,
      short_name: short_raw || null,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("religions update:", err);
    if (e?.code === "23505") return res.status(409).json({ error: "Religion already exists" });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const row = await svc.deleteReligion(parseInt(String(req.params.id), 10));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("religions delete:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

