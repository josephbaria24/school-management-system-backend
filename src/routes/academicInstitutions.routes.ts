import { Router } from "express";
import * as institutionController from "../controllers/academicInstitutions.controller.js";

const router = Router();

// Institution Classifications
router.get("/institution-classifications", institutionController.getClassifications);
router.post("/institution-classifications", institutionController.createClassification);
router.put("/institution-classifications/:id", institutionController.updateClassification);
router.delete("/institution-classifications/:id", institutionController.deleteClassification);
router.get("/institution-heads", institutionController.getInstitutionHeads);
router.post("/institution-heads", institutionController.createInstitutionHead);
router.put("/institution-heads/:id", institutionController.updateInstitutionHead);
router.delete("/institution-heads/:id", institutionController.deleteInstitutionHead);
router.get("/institution-head-titles", institutionController.getInstitutionHeadTitles);
router.post("/institution-head-titles", institutionController.createInstitutionHeadTitle);
router.put("/institution-head-titles/:id", institutionController.updateInstitutionHeadTitle);
router.delete("/institution-head-titles/:id", institutionController.deleteInstitutionHeadTitle);

// Academic Institutions CRUD
router.get("/academic-institutions", institutionController.getAll);
router.get("/academic-institutions/:id", institutionController.getById);
router.post("/academic-institutions", institutionController.create);
router.put("/academic-institutions/:id", institutionController.update);
router.delete("/academic-institutions/:id", institutionController.remove);

export default router;
