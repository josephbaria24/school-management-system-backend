import { Request, Response } from "express";
import * as collegesService from "../services/colleges.service.js";

export const getAll = async (req: Request, res: Response) => {
  try {
    const campusId = req.query.campus_id
      ? parseInt(String(req.query.campus_id), 10)
      : undefined;
    const rows = await collegesService.getAllColleges(campusId);
    res.json(rows);
  } catch (err) {
    console.error("Colleges Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const row = await collegesService.getCollegeById(
      parseInt(req.params.id as string, 10)
    );
    if (!row) return res.status(404).json({ error: "College not found" });
    res.json(row);
  } catch (err) {
    console.error("Colleges Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { campus_id, college_code, college_name } = req.body;
    if (!campus_id || !college_code?.trim() || !college_name?.trim()) {
      return res
        .status(400)
        .json({ error: "Campus, college code, and college name are required" });
    }
    const created = await collegesService.createCollege(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    console.error("Colleges Controller Error:", err);
    if (err?.code === "23505") {
      return res
        .status(409)
        .json({ error: "College code already exists for this campus" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { campus_id, college_code, college_name } = req.body;
    if (!campus_id || !college_code?.trim() || !college_name?.trim()) {
      return res
        .status(400)
        .json({ error: "Campus, college code, and college name are required" });
    }
    const updated = await collegesService.updateCollege(id, req.body);
    if (!updated) return res.status(404).json({ error: "College not found" });
    res.json(updated);
  } catch (err: any) {
    console.error("Colleges Controller Error:", err);
    if (err?.code === "23505") {
      return res
        .status(409)
        .json({ error: "College code already exists for this campus" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const deleted = await collegesService.deleteCollege(
      parseInt(req.params.id as string, 10)
    );
    if (!deleted) return res.status(404).json({ error: "College not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Colleges Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
