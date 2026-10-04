import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getUser, updateUser, deleteUser } from "../controllers/user.controller";
import { list as listNotifications } from "../controllers/notification.controller";

const router = Router();

router.get("/:id", authenticate, getUser);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);

router.get("/:id/notifications", authenticate, listNotifications);

export default router;