import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { create, getOne, updateStatus, remove } from "../controllers/submission.controller";
import { add, list } from "../controllers/comment.controller";
import { approve, requestChanges, history } from "../controllers/review.controller";

const router = Router();

router.post("/", authenticate, create);
router.get("/:id", authenticate, getOne);
router.put("/:id/status", authenticate, updateStatus);
router.delete("/:id", authenticate, remove);

router.post("/:id/comments", authenticate, add);
router.get("/:id/comments", authenticate, list);

router.post("/:id/approve", authenticate, approve);
router.post("/:id/request-changes", authenticate, requestChanges);
router.get("/:id/reviews", authenticate, history);

export default router;