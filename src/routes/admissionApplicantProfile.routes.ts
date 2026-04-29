import { Router } from "express";
import * as ctl from "../controllers/admissionApplicantProfile.controller.js";

const router = Router();

router.get("/admission/applicant-profile", ctl.getProfile);
router.put("/admission/applicant-profile", ctl.upsertProfile);
router.get("/admission/applications", ctl.listApplications);
router.post("/admission/applications", ctl.createApplication);
router.post("/admission/applications/:appNo/status-action", ctl.applyApplicationStatusAction);

export default router;
