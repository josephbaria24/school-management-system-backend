import { Request, Response } from "express";
import * as svc from "../services/nationalities.service.js";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getAllNationalities();
    res.json(rows);
  } catch (err) {
    console.error("nationalities getAll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const row = await svc.getNationalityById(parseInt(String(req.params.id), 10));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("nationalities getById:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const nationality_name = String(req.body.nationality_name ?? "").trim();
    const short_raw = String(req.body.short_name ?? "").trim();
    if (!nationality_name) {
      return res.status(400).json({ error: "Nationality name is required" });
    }
    const row = await svc.createNationality({
      nationality_name,
      short_name: short_raw || null,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("nationalities create:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Nationality already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const nationality_name = String(req.body.nationality_name ?? "").trim();
    const short_raw = String(req.body.short_name ?? "").trim();
    if (!nationality_name) {
      return res.status(400).json({ error: "Nationality name is required" });
    }
    const row = await svc.updateNationality(id, {
      nationality_name,
      short_name: short_raw || null,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("nationalities update:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Nationality already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const row = await svc.deleteNationality(parseInt(String(req.params.id), 10));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("nationalities delete:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

