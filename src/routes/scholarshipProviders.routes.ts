import { Router } from "express";
import * as ctrl from "../controllers/scholarshipProviders.controller.js";

const router = Router();

router.get("/scholarship-provider-groups", ctrl.getGroups);
router.post("/scholarship-provider-groups", ctrl.createGroup);

router.get("/scholarship-providers", ctrl.getProviders);
router.post("/scholarship-providers", ctrl.createProvider);
router.put("/scholarship-providers/:id", ctrl.updateProvider);
router.delete("/scholarship-providers/:id", ctrl.deleteProvider);

export default router;
