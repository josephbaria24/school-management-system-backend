import { Router } from "express";
import * as ctrl from "../controllers/positions.controller.js";

const router = Router();

router.get("/positions", ctrl.getAll);
router.get("/positions/:id", ctrl.getById);
router.post("/positions", ctrl.create);
router.put("/positions/:id", ctrl.update);
router.delete("/positions/:id", ctrl.remove);

export default router;
