import { Request, Response } from "express";
import * as svc from "../services/userRights.service.js";

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getUsers();
    res.json(rows);
  } catch (err) {
    console.error("user-rights getUsers:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const employee_id = String(req.body.employee_id ?? "").trim();
    if (!employee_id) {
      return res.status(400).json({ error: "employee_id is required" });
    }
    const result = await svc.createUser(employee_id);
    if (result.code === "EMPLOYEE_NOT_FOUND") {
      return res.status(404).json({ error: "Employee not found" });
    }
    if (result.code === "DEFAULT_GROUP_MISSING") {
      return res.status(500).json({ error: "Default group is missing" });
    }
    if (result.code === "ALREADY_EXISTS") {
      return res.status(409).json({ error: "User already exists" });
    }
    res.status(201).json(result.row);
  } catch (err) {
    console.error("user-rights createUser:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateUserGroup = async (req: Request, res: Response) => {
  try {
    const employeeId = String(req.params.employeeId ?? "").trim();
    const group_id = parseInt(String(req.body.group_id), 10);
    if (!employeeId || !Number.isFinite(group_id)) {
      return res.status(400).json({ error: "employeeId and group_id are required" });
    }
    const row = await svc.updateUserGroup(employeeId, group_id);
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Updated" });
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("user-rights updateUserGroup:", err);
    if (e?.code === "23503") {
      return res.status(400).json({ error: "Invalid group reference" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateUsername = async (req: Request, res: Response) => {
  try {
    const employeeId = String(req.params.employeeId ?? "").trim();
    const username = String(req.body.username ?? "").trim();
    if (!employeeId || !username) {
      return res.status(400).json({ error: "employeeId and username are required" });
    }
    const row = await svc.updateUsername(employeeId, username);
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("user-rights updateUsername:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getGroups = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getGroups();
    res.json(rows);
  } catch (err) {
    console.error("user-rights getGroups:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const wallpaper = String(req.body.wallpaper ?? "").trim();
    if (!name) return res.status(400).json({ error: "Group name is required" });
    const row = await svc.createGroup({
      name,
      description: description || null,
      wallpaper: wallpaper || null,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("user-rights createGroup:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Group already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const wallpaper = String(req.body.wallpaper ?? "").trim();
    if (!Number.isFinite(id) || !name) {
      return res.status(400).json({ error: "Group id and name are required" });
    }
    const row = await svc.updateGroup(id, {
      name,
      description: description || null,
      wallpaper: wallpaper || null,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("user-rights updateGroup:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Group already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const removeGroup = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const result = await svc.deleteGroup(id);
    if (!result.deleted && result.code === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (!result.deleted && result.code === "DEFAULT_GROUP") {
      return res.status(400).json({ error: "Default group cannot be deleted" });
    }
    if (!result.deleted && result.code === "DEFAULT_GROUP_MISSING") {
      return res.status(500).json({ error: "Default group is missing" });
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("user-rights removeGroup:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getGroupPrivileges = async (req: Request, res: Response) => {
  try {
    const groupId = parseInt(String(req.params.groupId), 10);
    if (!Number.isFinite(groupId)) return res.status(400).json({ error: "Invalid group id" });
    const rows = await svc.getGroupPrivileges(groupId);
    res.json(rows);
  } catch (err) {
    console.error("user-rights getGroupPrivileges:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateGroupPrivilege = async (req: Request, res: Response) => {
  try {
    const groupId = parseInt(String(req.params.groupId), 10);
    const privilegeId = parseInt(String(req.params.privilegeId), 10);
    if (!Number.isFinite(groupId) || !Number.isFinite(privilegeId)) {
      return res.status(400).json({ error: "Invalid ids" });
    }
    const read = !!req.body.read;
    const write = !!req.body.write;
    const del = !!req.body.delete;
    const print = !!req.body.print;
    const exp = !!req.body.export;
    const ref_id =
      req.body.ref_id === undefined || req.body.ref_id === null
        ? undefined
        : String(req.body.ref_id);
    const row = await svc.updateGroupPrivilege(groupId, privilegeId, {
      read,
      write,
      delete: del,
      print,
      export: exp,
      ref_id,
    });
    if (!row) return res.status(404).json({ error: "Privilege not found" });
    res.json({ message: "Updated" });
  } catch (err) {
    console.error("user-rights updateGroupPrivilege:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

