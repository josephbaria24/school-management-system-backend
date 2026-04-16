import { Router } from "express";
import * as campusController from "../controllers/campuses.controller.js";

const router = Router();

router.get("/campuses", campusController.getAll);
router.get("/campuses/:id", campusController.getById);
router.post("/campuses", campusController.create);
router.put("/campuses/:id", campusController.update);
router.delete("/campuses/:id", campusController.remove);

export default router;
