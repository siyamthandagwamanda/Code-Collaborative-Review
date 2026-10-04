import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as statsService from "../services/stats.service";
import { sendError } from "../utils/send-error";

export async function getStats(req: AuthRequest, res: Response) {
    try {
        const projectId = Number(req.params.id);
        if (Number.isNaN(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        const stats = await statsService.getProjectStats(projectId, req.user!.id);
        res.status(200).json(stats);
    } catch (err) {
        sendError(res, err, "Failed to fetch project stats");
    }
}