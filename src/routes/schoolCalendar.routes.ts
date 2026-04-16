import { Router } from "express";
import * as schoolCalendarController from "../controllers/schoolCalendar.controller.js";

const router = Router();

router.get("/school-calendar", schoolCalendarController.getAll);
router.post("/school-calendar", schoolCalendarController.create);
router.put("/school-calendar/:id", schoolCalendarController.update);
router.delete("/school-calendar/:id", schoolCalendarController.remove);

export default router;
