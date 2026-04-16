import { Router } from "express";
import * as ctrl from "../controllers/departments.controller.js";

const router = Router();

router.get("/departments", ctrl.getAll);
router.get("/departments/:id", ctrl.getById);
router.post("/departments", ctrl.create);
router.put("/departments/:id", ctrl.update);
router.delete("/departments/:id", ctrl.remove);

export default router;
