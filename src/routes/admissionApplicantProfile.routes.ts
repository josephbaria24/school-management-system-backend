import { Router } from "express";
import * as ctl from "../controllers/admissionApplicantProfile.controller.js";

const router = Router();

router.get("/admission/applicant-profile", ctl.getProfile);
router.put("/admission/applicant-profile", ctl.upsertProfile);
router.get("/admission/applications", ctl.listApplications);
router.get("/admission/college-entrance-ranking/summary", ctl.getCollegeEntranceRankingSummary);
router.get("/admission/testing-schedules", ctl.listTestingSchedules);
router.post("/admission/testing-schedules", ctl.createTestingSchedule);
router.put("/admission/testing-schedules/:id", ctl.updateTestingSchedule);
router.delete("/admission/testing-schedules/:id", ctl.deleteTestingSchedule);
router.post("/admission/applications", ctl.createApplication);
router.post("/admission/applications/:appNo/status-action", ctl.applyApplicationStatusAction);

export default router;
