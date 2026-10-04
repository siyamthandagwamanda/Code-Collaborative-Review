import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as commentService from "../services/comment.service";
import { sendError } from "../utils/send-error";

export async function add(req: AuthRequest, res: Response) {
    try {
        const submissionId = Number(req.params.id);
        const { body, line_number } = req.body;

        if (Number.isNaN(submissionId) || !body) {
            return res.status(400).json({ message: "Valid submission id and body are required" });
        }

        let lineNumber: number | null = null;
        if (line_number !== undefined && line_number !== null) {
            lineNumber = Number(line_number);
            if (!Number.isInteger(lineNumber) || lineNumber < 1) {
                return res.status(400).json({ message: "line_number must be a positive whole number" });
            }
        }

        const comment = await commentService.addComment(
            submissionId,
            req.user!.id,
            req.user!.role,
            body,
            lineNumber
        );
        res.status(201).json(comment);
    } catch (err) {
        sendError(res, err, "Failed to add comment");
    }
}

export async function list(req: AuthRequest, res: Response) {
    try {
        const submissionId = Number(req.params.id);
        if (Number.isNaN(submissionId)) {
            return res.status(400).json({ message: "Invalid submission id" });
        }

        const comments = await commentService.getComments(submissionId, req.user!.id);
        res.status(200).json(comments);
    } catch (err) {
        sendError(res, err, "Failed to fetch comments");
    }
}

export async function update(req: AuthRequest, res: Response) {
    try {
        const id = Number(req.params.id);
        const { body } = req.body;

        if (Number.isNaN(id) || !body) {
            return res.status(400).json({ message: "Valid comment id and body are required" });
        }

        const comment = await commentService.updateComment(id, req.user!.id, body);
        res.status(200).json(comment);
    } catch (err) {
        sendError(res, err, "Failed to update comment");
    }
}

export async function remove(req: AuthRequest, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid comment id" });
        }

        await commentService.deleteComment(id, req.user!.id);
        res.status(200).json({ message: "Comment deleted" });
    } catch (err) {
        sendError(res, err, "Failed to delete comment");
    }
}