import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { create, getOne, updateStatus, remove } from "../controllers/submission.controller";

const router = Router();

router.post("/", authenticate, create);
router.get("/:id", authenticate, getOne);
router.put("/:id/status", authenticate, updateStatus);
router.delete("/:id", authenticate, remove);

export default router;