import { Router } from "express";
import * as groups from "../controllers/majorDisciplineGroups.controller.js";
import * as ched from "../controllers/chedMajorDisciplines.controller.js";
import * as programs from "../controllers/academicPrograms.controller.js";
import * as links from "../controllers/academicProgramMajorDisciplines.controller.js";

const router = Router();

router.get("/major-discipline-groups", groups.getAll);
router.post("/major-discipline-groups", groups.create);
router.put("/major-discipline-groups/:id", groups.update);
router.delete("/major-discipline-groups/:id", groups.remove);

router.get("/ched-major-disciplines", ched.getAll);
router.post("/ched-major-disciplines", ched.create);
router.put("/ched-major-disciplines/:id", ched.update);
router.delete("/ched-major-disciplines/:id", ched.remove);

router.get("/academic-programs", programs.getAll);
router.get("/academic-programs/:id", programs.getById);
router.post("/academic-programs", programs.create);
router.put("/academic-programs/:id", programs.update);
router.delete("/academic-programs/:id", programs.remove);

router.get(
  "/academic-programs/:programId/major-disciplines",
  links.getByProgram
);
router.post(
  "/academic-programs/:programId/major-disciplines",
  links.create
);
router.put("/academic-program-major-disciplines/:id", links.update);
router.delete("/academic-program-major-disciplines/:id", links.remove);

export default router;
