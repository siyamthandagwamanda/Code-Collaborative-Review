import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { update, remove } from "../controllers/comment.controller";

const router = Router();

router.put("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);

export default router;