import { Request, Response } from "express";
import * as svc from "../services/positions.service.js";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getAllPositions();
    res.json(rows);
  } catch (err) {
    console.error("positions getAll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const row = await svc.getPositionById(
      parseInt(String(req.params.id), 10)
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("positions getById:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const position_code = String(req.body.position_code ?? "").trim();
    const position_title = String(req.body.position_title ?? "").trim();
    const short_raw = req.body.short_name;
    const short_name =
      short_raw === undefined || short_raw === null || String(short_raw).trim() === ""
        ? null
        : String(short_raw).trim();
    if (!position_code || !position_title) {
      return res.status(400).json({
        error: "Position code and position title are required",
      });
    }
    const row = await svc.createPosition({
      position_code,
      position_title,
      short_name,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("positions create:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Position code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const position_code = String(req.body.position_code ?? "").trim();
    const position_title = String(req.body.position_title ?? "").trim();
    const short_raw = req.body.short_name;
    const short_name =
      short_raw === undefined || short_raw === null || String(short_raw).trim() === ""
        ? null
        : String(short_raw).trim();
    if (!position_code || !position_title) {
      return res.status(400).json({
        error: "Position code and position title are required",
      });
    }
    const row = await svc.updatePosition(id, {
      position_code,
      position_title,
      short_name,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("positions update:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Position code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const row = await svc.deletePosition(
      parseInt(String(req.params.id), 10)
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("positions delete:", err);
    if (e?.code === "23503") {
      return res
        .status(409)
        .json({ error: "Cannot delete: assigned to an employee" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
