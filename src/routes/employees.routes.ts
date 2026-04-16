import { Router } from "express";
import * as ctrl from "../controllers/employees.controller.js";

const router = Router();

router.get("/employees", ctrl.getAll);
router.get("/employees/:id", ctrl.getById);
router.post("/employees", ctrl.create);
router.put("/employees/:id", ctrl.update);
router.delete("/employees/:id", ctrl.remove);

export default router;
