import { Router } from "express";
import * as collegesController from "../controllers/colleges.controller.js";

const router = Router();

router.get("/colleges", collegesController.getAll);
router.get("/colleges/:id", collegesController.getById);
router.post("/colleges", collegesController.create);
router.put("/colleges/:id", collegesController.update);
router.delete("/colleges/:id", collegesController.remove);

export default router;
