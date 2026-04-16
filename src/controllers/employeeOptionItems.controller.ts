import { Request, Response } from "express";
import * as svc from "../services/employeeOptionItems.service.js";

const parseCategory = (raw: unknown) => {
  const category = String(raw ?? "").trim();
  if (!svc.isEmployeeOptionCategory(category)) return null;
  return category;
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const category = parseCategory(req.query.category);
    if (!category) {
      return res.status(400).json({
        error:
          "Invalid category. Use one of: teaching_load_educ_level, degree_discipline, prc_licensure",
      });
    }
    const rows = await svc.getEmployeeOptionItems(category);
    res.json(rows);
  } catch (err) {
    console.error("employee option items getAll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const category = parseCategory(req.body.category);
    const value = String(req.body.value ?? "").trim();
    if (!category || !value) {
      return res.status(400).json({
        error: "Valid category and value are required",
      });
    }
    const row = await svc.createEmployeeOptionItem(category, value);
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("employee option items create:", err);
    if (e?.code === "23505") {
      return res
        .status(409)
        .json({ error: "Option already exists for this category" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const value = String(req.body.value ?? "").trim();
    if (!Number.isFinite(id) || !value) {
      return res.status(400).json({ error: "Valid id and value are required" });
    }
    const row = await svc.updateEmployeeOptionItem(id, value);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("employee option items update:", err);
    if (e?.code === "23505") {
      return res
        .status(409)
        .json({ error: "Option already exists for this category" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const row = await svc.deleteEmployeeOptionItem(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("employee option items delete:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
