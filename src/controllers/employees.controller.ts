import { Request, Response } from "express";
import * as svc from "../services/employees.service.js";

export const getAll = async (req: Request, res: Response) => {
  try {
    const hideInactive =
      String(req.query.hide_inactive || req.query.hideInactive || "") ===
      "true";
    const rows = await svc.getAllEmployees({ hideInactive });
    res.json(rows);
  } catch (err) {
    console.error("employees getAll:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const row = await svc.getEmployeeById(
      parseInt(String(req.params.id), 10)
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("employees getById:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { employee_id, last_name, first_name } = req.body;
    if (!employee_id?.trim() || !last_name?.trim() || !first_name?.trim()) {
      return res.status(400).json({
        error: "Employee ID, last name, and first name are required",
      });
    }
    const row = await svc.createEmployee(req.body as Record<string, unknown>);
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("employees create:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Employee ID already exists" });
    }
    if (e?.code === "23503") {
      return res
        .status(400)
        .json({ error: "Invalid department or position reference" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { employee_id, last_name, first_name } = req.body;
    if (!employee_id?.trim() || !last_name?.trim() || !first_name?.trim()) {
      return res.status(400).json({
        error: "Employee ID, last name, and first name are required",
      });
    }
    const row = await svc.updateEmployee(
      id,
      req.body as Record<string, unknown>
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("employees update:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Employee ID already exists" });
    }
    if (e?.code === "23503") {
      return res
        .status(400)
        .json({ error: "Invalid department or position reference" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const row = await svc.deleteEmployee(parseInt(String(req.params.id), 10));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("employees delete:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
