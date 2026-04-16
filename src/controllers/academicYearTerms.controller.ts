import { Request, Response } from "express";
import * as academicYearTermsService from "../services/academicYearTerms.service.js";

export const getAll = async (req: Request, res: Response) => {
  try {
    const rows = await academicYearTermsService.getAllAcademicYearTerms();
    res.json(rows);
  } catch (err) {
    console.error("AcademicYearTerms Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const academicYear = typeof req.body?.academic_year === "string" ? req.body.academic_year.trim() : "";
    const term = typeof req.body?.term === "string" ? req.body.term.trim() : "";

    if (!academicYear || !term) {
      return res.status(400).json({ error: "Academic year and term are required" });
    }

    const created = await academicYearTermsService.createAcademicYearTerm({
      ...req.body,
      academic_year: academicYear,
      term,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("AcademicYearTerms Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const academicYear = typeof req.body?.academic_year === "string" ? req.body.academic_year.trim() : "";
    const term = typeof req.body?.term === "string" ? req.body.term.trim() : "";

    if (!academicYear || !term) {
      return res.status(400).json({ error: "Academic year and term are required" });
    }

    const updated = await academicYearTermsService.updateAcademicYearTerm(id, {
      ...req.body,
      academic_year: academicYear,
      term,
    });
    if (!updated) return res.status(404).json({ error: "Academic year term not found" });
    res.json(updated);
  } catch (err) {
    console.error("AcademicYearTerms Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const deleted = await academicYearTermsService.deleteAcademicYearTerm(id);
    if (!deleted) return res.status(404).json({ error: "Academic year term not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("AcademicYearTerms Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
