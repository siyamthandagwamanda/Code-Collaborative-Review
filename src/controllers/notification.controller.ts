import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as notificationService from "../services/notification.service";
import { sendError } from "../utils/send-error";

export async function list(req: AuthRequest, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const notifications = await notificationService.getNotifications(id, req.user!.id);
        res.status(200).json(notifications);
    } catch (err) {
        sendError(res, err, "Failed to fetch notifications");
    }
}