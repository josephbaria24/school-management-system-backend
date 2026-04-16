import { Router } from "express";
import * as ctrl from "../controllers/coursesMasterList.controller.js";

const router = Router();

router.get("/courses-master-list", ctrl.getAll);
router.get("/courses-master-list/:id", ctrl.getById);
router.post("/courses-master-list", ctrl.create);
router.put("/courses-master-list/:id", ctrl.update);
router.delete("/courses-master-list/:id", ctrl.remove);

export default router;

