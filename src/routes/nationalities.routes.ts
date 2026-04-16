import { Router } from "express";
import * as ctrl from "../controllers/nationalities.controller.js";

const router = Router();

router.get("/nationalities", ctrl.getAll);
router.get("/nationalities/:id", ctrl.getById);
router.post("/nationalities", ctrl.create);
router.put("/nationalities/:id", ctrl.update);
router.delete("/nationalities/:id", ctrl.remove);

export default router;

