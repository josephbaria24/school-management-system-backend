import { Request, Response } from "express";
import * as campusService from "../services/campuses.service.js";

export const getAll = async (req: Request, res: Response) => {
  try {
    const institutionId = req.query.institution_id ? parseInt(req.query.institution_id as string) : undefined;
    const campuses = await campusService.getAllCampuses(institutionId);
    res.json(campuses);
  } catch (err) {
    console.error("Campus Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const campus = await campusService.getCampusById(parseInt(req.params.id as string));
    if (!campus) return res.status(404).json({ error: "Campus not found" });
    res.json(campus);
  } catch (err) {
    console.error("Campus Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { acronym } = req.body;
    if (!acronym) {
      return res.status(400).json({ error: "Campus acronym is required" });
    }
    const newCampus = await campusService.createCampus(req.body);
    res.status(201).json(newCampus);
  } catch (err) {
    console.error("Campus Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const updated = await campusService.updateCampus(parseInt(req.params.id as string), req.body);
    if (!updated) return res.status(404).json({ error: "Campus not found" });
    res.json(updated);
  } catch (err) {
    console.error("Campus Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const deleted = await campusService.deleteCampus(parseInt(req.params.id as string));
    if (!deleted) return res.status(404).json({ error: "Campus not found" });
    res.json({ message: "Campus deleted successfully" });
  } catch (err) {
    console.error("Campus Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
