import { Request, Response } from "express";
import * as institutionService from "../services/academicInstitutions.service.js";

export const getAll = async (req: Request, res: Response) => {
  try {
    const institutions = await institutionService.getAllInstitutions();
    res.json(institutions);
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const institution = await institutionService.getInstitutionById(parseInt(req.params.id as string));
    if (!institution) return res.status(404).json({ error: "Institution not found" });
    res.json(institution);
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { official_name, classification_id } = req.body;
    if (!official_name || !classification_id) {
      return res.status(400).json({ error: "Official name and classification are required" });
    }
    const newInstitution = await institutionService.createInstitution(req.body);
    res.status(201).json(newInstitution);
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const updated = await institutionService.updateInstitution(parseInt(req.params.id as string), req.body);
    if (!updated) return res.status(404).json({ error: "Institution not found" });
    res.json(updated);
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const deleted = await institutionService.deleteInstitution(parseInt(req.params.id as string));
    if (!deleted) return res.status(404).json({ error: "Institution not found" });
    res.json({ message: "Institution deleted successfully" });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getClassifications = async (req: Request, res: Response) => {
  try {
    const classifications = await institutionService.getAllClassifications();
    res.json(classifications);
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createClassification = async (req: Request, res: Response) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : undefined;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const classification = await institutionService.createClassification(name, description);
    res.status(201).json(classification);
  } catch (err: any) {
    console.error("Controller Error:", err);
    if (err?.code === "23505") {
      return res.status(409).json({ error: "This classification already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateClassification = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : undefined;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const classification = await institutionService.updateClassification(id, name, description);
    if (!classification) return res.status(404).json({ error: "Classification not found" });
    res.json(classification);
  } catch (err: any) {
    console.error("Controller Error:", err);
    if (err?.code === "23505") {
      return res.status(409).json({ error: "This classification already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteClassification = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const classification = await institutionService.deleteClassification(id);
    if (!classification) return res.status(404).json({ error: "Classification not found" });
    res.json({ message: "Classification deleted successfully" });
  } catch (err: any) {
    console.error("Controller Error:", err);
    if (err?.code === "23503") {
      return res.status(409).json({ error: "Cannot delete classification in use by an institution" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getInstitutionHeads = async (req: Request, res: Response) => {
  try {
    const heads = await institutionService.getAllInstitutionHeads();
    res.json(heads);
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createInstitutionHead = async (req: Request, res: Response) => {
  try {
    const fullName = typeof req.body?.full_name === "string" ? req.body.full_name.trim() : "";
    if (!fullName) {
      return res.status(400).json({ error: "Full name is required" });
    }

    const head = await institutionService.createInstitutionHead(fullName);
    res.status(201).json(head);
  } catch (err: any) {
    console.error("Controller Error:", err);
    if (err?.code === "23505") {
      return res.status(409).json({ error: "This name already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateInstitutionHead = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const fullName = typeof req.body?.full_name === "string" ? req.body.full_name.trim() : "";
    if (!fullName) {
      return res.status(400).json({ error: "Full name is required" });
    }

    const head = await institutionService.updateInstitutionHead(id, fullName);
    if (!head) return res.status(404).json({ error: "Head not found" });
    res.json(head);
  } catch (err: any) {
    console.error("Controller Error:", err);
    if (err?.code === "23505") {
      return res.status(409).json({ error: "This name already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteInstitutionHead = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const head = await institutionService.deleteInstitutionHead(id);
    if (!head) return res.status(404).json({ error: "Head not found" });
    res.json({ message: "Head deleted successfully" });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getInstitutionHeadTitles = async (req: Request, res: Response) => {
  try {
    const titles = await institutionService.getAllInstitutionHeadTitles();
    res.json(titles);
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createInstitutionHeadTitle = async (req: Request, res: Response) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const title = await institutionService.createInstitutionHeadTitle(name);
    res.status(201).json(title);
  } catch (err: any) {
    console.error("Controller Error:", err);
    if (err?.code === "23505") {
      return res.status(409).json({ error: "This title already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateInstitutionHeadTitle = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const title = await institutionService.updateInstitutionHeadTitle(id, name);
    if (!title) return res.status(404).json({ error: "Title not found" });
    res.json(title);
  } catch (err: any) {
    console.error("Controller Error:", err);
    if (err?.code === "23505") {
      return res.status(409).json({ error: "This title already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteInstitutionHeadTitle = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const title = await institutionService.deleteInstitutionHeadTitle(id);
    if (!title) return res.status(404).json({ error: "Title not found" });
    res.json({ message: "Title deleted successfully" });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
