import { Router } from "express";
import * as ctrl from "../controllers/employeeOptionItems.controller.js";

const router = Router();

router.get("/employee-option-items", ctrl.getAll);
router.post("/employee-option-items", ctrl.create);
router.put("/employee-option-items/:id", ctrl.update);
router.delete("/employee-option-items/:id", ctrl.remove);

export default router;
