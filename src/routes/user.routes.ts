import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getUser, updateUser, deleteUser } from "../controllers/user.controller";

const router = Router();

router.get("/:id", authenticate, getUser);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);

export default router;