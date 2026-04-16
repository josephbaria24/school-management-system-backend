import { Router } from "express";
import * as ctrl from "../controllers/religions.controller.js";

const router = Router();

router.get("/religions", ctrl.getAll);
router.get("/religions/:id", ctrl.getById);
router.post("/religions", ctrl.create);
router.put("/religions/:id", ctrl.update);
router.delete("/religions/:id", ctrl.remove);

export default router;

