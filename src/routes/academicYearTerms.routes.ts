import { Router } from "express";
import * as academicYearTermsController from "../controllers/academicYearTerms.controller.js";

const router = Router();

router.get("/academic-year-terms", academicYearTermsController.getAll);
router.post("/academic-year-terms", academicYearTermsController.create);
router.put("/academic-year-terms/:id", academicYearTermsController.update);
router.delete("/academic-year-terms/:id", academicYearTermsController.remove);

export default router;
