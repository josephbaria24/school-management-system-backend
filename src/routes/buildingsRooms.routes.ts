import { Router } from "express";
import * as ctrl from "../controllers/buildingsRooms.controller.js";

const router = Router();

router.get("/buildings-rooms/tree", ctrl.getTree);
router.get("/buildings-rooms/rooms", ctrl.getRooms);
router.post("/buildings-rooms/buildings", ctrl.createBuilding);
router.put("/buildings-rooms/buildings/:id", ctrl.updateBuilding);
router.delete("/buildings-rooms/buildings/:id", ctrl.deleteBuilding);
router.post("/buildings-rooms/floors", ctrl.createFloor);
router.put("/buildings-rooms/floors/:id", ctrl.updateFloor);
router.delete("/buildings-rooms/floors/:id", ctrl.deleteFloor);
router.post("/buildings-rooms/rooms", ctrl.createRoom);
router.put("/buildings-rooms/rooms/:id", ctrl.updateRoom);
router.delete("/buildings-rooms/rooms/:id", ctrl.deleteRoom);

export default router;

