import { Router } from "express";
import * as ctrl from "../controllers/userRights.controller.js";

const router = Router();

router.get("/user-rights/users", ctrl.getUsers);
router.post("/user-rights/users", ctrl.createUser);
router.put("/user-rights/users/:employeeId/group", ctrl.updateUserGroup);
router.put("/user-rights/users/:employeeId/username", ctrl.updateUsername);

router.get("/user-rights/groups", ctrl.getGroups);
router.post("/user-rights/groups", ctrl.createGroup);
router.put("/user-rights/groups/:id", ctrl.updateGroup);
router.delete("/user-rights/groups/:id", ctrl.removeGroup);
router.get("/user-rights/groups/:groupId/privileges", ctrl.getGroupPrivileges);
router.put("/user-rights/groups/:groupId/privileges/:privilegeId", ctrl.updateGroupPrivilege);

export default router;

