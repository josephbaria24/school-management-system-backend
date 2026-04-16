import { Router } from "express";
import * as areasCtrl from "../controllers/subjectAreas.controller.js";
import * as modesCtrl from "../controllers/subjectModes.controller.js";

const router = Router();

router.get("/subject-areas", areasCtrl.getAll);
router.get("/subject-areas/:id", areasCtrl.getById);
router.post("/subject-areas", areasCtrl.create);
router.put("/subject-areas/:id", areasCtrl.update);
router.delete("/subject-areas/:id", areasCtrl.remove);

router.get("/subject-modes", modesCtrl.getAll);
router.get("/subject-modes/:id", modesCtrl.getById);
router.post("/subject-modes", modesCtrl.create);
router.put("/subject-modes/:id", modesCtrl.update);
router.delete("/subject-modes/:id", modesCtrl.remove);

export default router;
