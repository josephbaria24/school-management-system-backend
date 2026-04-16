import { Request, Response } from "express";
import * as svc from "../services/majorDisciplineGroups.service.js";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getAllMajorDisciplineGroups();
    res.json(rows);
  } catch (err) {
    console.error("majorDisciplineGroups:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { group_code, group_description } = req.body;
    if (!group_code?.trim() || !group_description?.trim()) {
      return res
        .status(400)
        .json({ error: "Group code and description are required" });
    }
    const row = await svc.createMajorDisciplineGroup({
      group_code: String(group_code),
      group_description: String(group_description),
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("majorDisciplineGroups:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Group code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { group_code, group_description } = req.body;
    if (!group_code?.trim() || !group_description?.trim()) {
      return res
        .status(400)
        .json({ error: "Group code and description are required" });
    }
    const row = await svc.updateMajorDisciplineGroup(id, {
      group_code: String(group_code),
      group_description: String(group_description),
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("majorDisciplineGroups:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Group code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const row = await svc.deleteMajorDisciplineGroup(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("majorDisciplineGroups:", err);
    if (e?.code === "23503") {
      return res
        .status(409)
        .json({ error: "Cannot delete: referenced by CHED disciplines" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
