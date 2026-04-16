import { Request, Response } from "express";
import * as groupsSvc from "../services/scholarshipProviderGroups.service.js";
import * as providersSvc from "../services/scholarshipProviders.service.js";

export const getGroups = async (_req: Request, res: Response) => {
  try {
    const rows = await groupsSvc.getAllScholarshipProviderGroups();
    res.json(rows);
  } catch (err) {
    console.error("scholarshipProviderGroups:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { group_code, group_name } = req.body;
    if (!group_code?.trim() || !group_name?.trim()) {
      return res
        .status(400)
        .json({ error: "Group code and name are required" });
    }
    const row = await groupsSvc.createScholarshipProviderGroup({
      group_code: String(group_code),
      group_name: String(group_name),
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("scholarshipProviderGroups:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Group code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getProviders = async (_req: Request, res: Response) => {
  try {
    const rows = await providersSvc.getAllScholarshipProviders();
    res.json(rows);
  } catch (err) {
    console.error("scholarshipProviders:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function parseBody(req: Request) {
  const groupRaw = req.body.group_id;
  let group_id: number | null = null;
  if (groupRaw !== undefined && groupRaw !== null && groupRaw !== "") {
    const n = parseInt(String(groupRaw), 10);
    if (Number.isFinite(n)) group_id = n;
  }
  return {
    provider_code: String(req.body.provider_code ?? "").trim(),
    provider_name: String(req.body.provider_name ?? "").trim(),
    short_name: req.body.short_name != null ? String(req.body.short_name) : null,
    acronym: req.body.acronym != null ? String(req.body.acronym) : null,
    remarks: req.body.remarks != null ? String(req.body.remarks) : null,
    group_id,
    is_inactive: !!req.body.is_inactive,
    auto_credit_financial_aid: !!req.body.auto_credit_financial_aid,
  };
}

export const createProvider = async (req: Request, res: Response) => {
  try {
    const data = parseBody(req);
    if (!data.provider_code || !data.provider_name) {
      return res
        .status(400)
        .json({ error: "Provider code and provider name are required" });
    }
    const row = await providersSvc.createScholarshipProvider(data);
    res.status(201).json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("scholarshipProviders:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Provider code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateProvider = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const data = parseBody(req);
    if (!data.provider_code || !data.provider_name) {
      return res
        .status(400)
        .json({ error: "Provider code and provider name are required" });
    }
    const row = await providersSvc.updateScholarshipProvider(id, data);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("scholarshipProviders:", err);
    if (e?.code === "23505") {
      return res.status(409).json({ error: "Provider code already exists" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteProvider = async (req: Request, res: Response) => {
  try {
    const row = await providersSvc.deleteScholarshipProvider(
      parseInt(String(req.params.id), 10)
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("scholarshipProviders:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
