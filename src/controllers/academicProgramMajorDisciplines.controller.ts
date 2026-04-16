import { Request, Response } from "express";
import * as svc from "../services/academicProgramMajorDisciplines.service.js";

export const getByProgram = async (req: Request, res: Response) => {
  try {
    const programId = parseInt(String(req.params.programId), 10);
    if (!Number.isFinite(programId)) {
      return res.status(400).json({ error: "Invalid program id" });
    }
    const rows = await svc.getLinksByProgram(programId);
    res.json(rows);
  } catch (err) {
    console.error("programMajorDisciplines:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const programId = parseInt(String(req.params.programId), 10);
    const discId = parseInt(String(req.body.ched_major_discipline_id), 10);
    if (!Number.isFinite(programId) || !Number.isFinite(discId)) {
      return res.status(400).json({ error: "Program and discipline are required" });
    }
    const row = await svc.createProgramMajorLink({
      academic_program_id: programId,
      ched_major_discipline_id: discId,
      offer: req.body.offer !== false,
      is_inactive: !!req.body.is_inactive,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("programMajorDisciplines:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Discipline already linked to program" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const offer = !!req.body.offer;
    const is_inactive = !!req.body.is_inactive;
    const row = await svc.updateProgramMajorLink(id, { offer, is_inactive });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("programMajorDisciplines:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const row = await svc.deleteProgramMajorLink(
      parseInt(String(req.params.id), 10)
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("programMajorDisciplines:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
