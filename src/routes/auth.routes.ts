import { Router } from "express";
import {register, login} from "../controllers/auth.controller";

const router = Router();

router.post("/registerUser", register);
router.post("/loginUser", login);

export default router;