import { Router } from "express";
import * as ctrl from "../controllers/programCurriculums.controller.js";

const router = Router();

router.get("/program-curriculums", ctrl.getCurriculums);
router.get("/program-curriculums/:id", ctrl.getCurriculumById);
router.post("/program-curriculums", ctrl.createCurriculum);
router.put("/program-curriculums/:id", ctrl.updateCurriculum);
router.delete("/program-curriculums/:id", ctrl.removeCurriculum);

router.get("/program-curriculums/:curriculumId/subjects", ctrl.getSubjects);
router.post("/program-curriculums/:curriculumId/subjects", ctrl.createSubject);
router.put("/program-curriculum-subjects/:subjectId", ctrl.updateSubject);
router.delete("/program-curriculum-subjects/:subjectId", ctrl.removeSubject);

export default router;

