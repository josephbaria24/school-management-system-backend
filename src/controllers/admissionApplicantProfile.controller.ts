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

export const getCollegeEntranceRankingSummary = async (req: Request, res: Response) => {
  try {
    const termId = req.query.term_id ? parseInt(String(req.query.term_id), 10) : undefined;
    const campusId = req.query.campus_id ? parseInt(String(req.query.campus_id), 10) : undefined;
    const courseId = req.query.course_id ? parseInt(String(req.query.course_id), 10) : undefined;
    const majorId = req.query.major_id ? parseInt(String(req.query.major_id), 10) : undefined;
    const majorStudy = typeof req.query.major_study === "string" ? req.query.major_study.trim() : undefined;
    const choiceNoRaw = req.query.choice_no ? parseInt(String(req.query.choice_no), 10) : 1;
    const choiceNo = [1, 2, 3, 4].includes(choiceNoRaw) ? (choiceNoRaw as 1 | 2 | 3 | 4) : 1;
    const row = await svc.getCollegeEntranceRankingSummary({
      termId,
      campusId,
      courseId,
      majorId,
      majorStudy,
      choiceNo,
    });
    res.json(row);
  } catch (err) {
    console.error("admissionApplicantProfile getCollegeEntranceRankingSummary:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const listTestingSchedules = async (req: Request, res: Response) => {
  try {
    const termId = req.query.term_id ? parseInt(String(req.query.term_id), 10) : undefined;
    const campusId = req.query.campus_id ? parseInt(String(req.query.campus_id), 10) : undefined;
    const batchId = typeof req.query.batch_id === "string" ? req.query.batch_id.trim() : undefined;
    const rows = await svc.listAdmissionTestingSchedules({ termId, campusId, batchId });
    res.json(rows);
  } catch (err) {
    console.error("admissionApplicantProfile listTestingSchedules:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createTestingSchedule = async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const row = await svc.createAdmissionTestingSchedule({
      termId: body.term_id ? Number(body.term_id) : null,
      campusId: body.campus_id ? Number(body.campus_id) : null,
      testingCenter: typeof body.testing_center === "string" ? body.testing_center : "",
      programClass: typeof body.program_class === "string" ? body.program_class : "",
      batchName: typeof body.batch_name === "string" ? body.batch_name : "",
      applicationType: typeof body.application_type === "string" ? body.application_type : "",
      testingRoom: typeof body.testing_room === "string" ? body.testing_room : "",
      testingDate: typeof body.testing_date === "string" ? body.testing_date : null,
      timeFrom: typeof body.time_from === "string" ? body.time_from : "",
      timeTo: typeof body.time_to === "string" ? body.time_to : "",
      session: typeof body.session === "string" ? body.session : "",
      limitCount: body.limit_count ? Number(body.limit_count) : 0,
      batchId: typeof body.batch_id === "string" ? body.batch_id : "",
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("admissionApplicantProfile createTestingSchedule:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateTestingSchedule = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const body = req.body as Record<string, unknown>;
    const row = await svc.updateAdmissionTestingSchedule(id, {
      termId: body.term_id ? Number(body.term_id) : null,
      campusId: body.campus_id ? Number(body.campus_id) : null,
      testingCenter: typeof body.testing_center === "string" ? body.testing_center : "",
      programClass: typeof body.program_class === "string" ? body.program_class : "",
      batchName: typeof body.batch_name === "string" ? body.batch_name : "",
      applicationType: typeof body.application_type === "string" ? body.application_type : "",
      testingRoom: typeof body.testing_room === "string" ? body.testing_room : "",
      testingDate: typeof body.testing_date === "string" ? body.testing_date : null,
      timeFrom: typeof body.time_from === "string" ? body.time_from : "",
      timeTo: typeof body.time_to === "string" ? body.time_to : "",
      session: typeof body.session === "string" ? body.session : "",
      limitCount: body.limit_count ? Number(body.limit_count) : 0,
      batchId: typeof body.batch_id === "string" ? body.batch_id : "",
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("admissionApplicantProfile updateTestingSchedule:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteTestingSchedule = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const row = await svc.deleteAdmissionTestingSchedule(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("admissionApplicantProfile deleteTestingSchedule:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
