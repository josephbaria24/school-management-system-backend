import { Request, Response } from "express";
import * as svc from "../services/admissionApplicantProfile.service.js";

const DEFAULT_PROFILE_KEY = "applicant-profile";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const profileKey =
      typeof req.query.profile_key === "string" && req.query.profile_key.trim()
        ? req.query.profile_key.trim()
        : DEFAULT_PROFILE_KEY;
    const row = await svc.getApplicantProfileByKey(profileKey);
    if (!row) return res.json(null);
    res.json(row);
  } catch (err) {
    console.error("admissionApplicantProfile getProfile:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const upsertProfile = async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      profile_key?: string;
      payload?: Record<string, unknown>;
    };
    const profileKey =
      typeof body.profile_key === "string" && body.profile_key.trim()
        ? body.profile_key.trim()
        : DEFAULT_PROFILE_KEY;
    if (!body.payload || typeof body.payload !== "object") {
      return res.status(400).json({ error: "payload object is required" });
    }
    const row = await svc.upsertApplicantProfileByKey(profileKey, body.payload);
    res.json(row);
  } catch (err) {
    console.error("admissionApplicantProfile upsertProfile:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const listApplications = async (req: Request, res: Response) => {
  try {
    const termId = req.query.term_id ? parseInt(String(req.query.term_id), 10) : undefined;
    const campusId = req.query.campus_id ? parseInt(String(req.query.campus_id), 10) : undefined;
    const rows = await svc.getAdmissionApplications(termId, campusId);
    res.json(rows);
  } catch (err) {
    console.error("admissionApplicantProfile listApplications:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createApplication = async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      app_no?: string;
      app_date?: string | null;
      term_id?: number | null;
      apply_type_id?: number | null;
      last_name?: string;
      first_name?: string;
      middle_name?: string;
      middle_initial?: string;
      gender?: string;
      date_of_birth?: string | null;
      choice1_campus_id?: number | null;
      choice1_course?: number | null;
      choice1_major_study?: string | null;
      or_no?: string;
    };
    const row = await svc.createAdmissionApplication({
      appNo: body.app_no,
      appDate: body.app_date ?? null,
      termId: body.term_id ?? null,
      applyTypeId: body.apply_type_id ?? null,
      lastName: body.last_name,
      firstName: body.first_name,
      middleName: body.middle_name,
      middleInitial: body.middle_initial,
      gender: body.gender,
      dateOfBirth: body.date_of_birth ?? null,
      choiceCampusId: body.choice1_campus_id ?? null,
      choiceCourseId: body.choice1_course ?? null,
      choiceMajorStudy: body.choice1_major_study ?? null,
      orNo: body.or_no,
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("admissionApplicantProfile createApplication:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const applyApplicationStatusAction = async (req: Request, res: Response) => {
  try {
    const appNo = String(req.params.appNo || "").trim();
    if (!appNo) return res.status(400).json({ error: "appNo is required" });
    const body = req.body as {
      action?: "admit" | "deny" | "cancel";
      deny_reason?: string;
    };
    if (!body.action || !["admit", "deny", "cancel"].includes(body.action)) {
      return res.status(400).json({ error: "action must be admit | deny | cancel" });
    }
    const row = await svc.applyApplicationStatusAction(appNo, body.action, body.deny_reason);
    if (!row) return res.status(404).json({ error: "Application not found" });
    res.json(row);
  } catch (err) {
    console.error("admissionApplicantProfile applyApplicationStatusAction:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
