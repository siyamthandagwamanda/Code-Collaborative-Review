import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { create, list, addMember, removeMember } from "../controllers/project.controller";
import { listByProject } from "../controllers/submission.controller";
import { getStats } from "../controllers/stats.controller";



const router = Router();

router.post("/", authenticate, create);
router.get("/", authenticate, list);
router.post("/:id/members", authenticate, addMember);
router.delete("/:id/members/:userId", authenticate, removeMember);

router.get("/:id/submissions", authenticate, listByProject);
router.get("/:id/stats", authenticate, getStats);

export default router;