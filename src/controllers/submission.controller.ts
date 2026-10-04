import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as submissionService from "../services/submission.service";
import { sendError } from "../utils/send-error";

export async function create(req: AuthRequest, res: Response) {
    try {
        const { project_id, title, code } = req.body;
        const projectId = Number(project_id);

        if (Number.isNaN(projectId) || !title || !code) {
            return res.status(400).json({ message: "project_id, title and code are required" });
        }

        const submission = await submissionService.createSubmission(
            projectId,
            req.user!.id,
            req.user!.role,
            title,
            code
        );
        res.status(201).json(submission);
    } catch (err) {
        sendError(res, err, "Failed to create submission");
    }
}

export async function listByProject(req: AuthRequest, res: Response) {
    try {
        const projectId = Number(req.params.id);
        if (Number.isNaN(projectId)) {
            return res.status(400).json({ message: "Invalid project id" });
        }

        const submissions = await submissionService.getSubmissionsByProject(projectId, req.user!.id);
        res.status(200).json(submissions);
    } catch (err) {
        sendError(res, err, "Failed to fetch submissions");
    }
}

export async function getOne(req: AuthRequest, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid submission id" });
        }

        const submission = await submissionService.getSubmission(id, req.user!.id);
        res.status(200).json(submission);
    } catch (err) {
        sendError(res, err, "Failed to fetch submission");
    }
}

export async function updateStatus(req: AuthRequest, res: Response) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        if (Number.isNaN(id) || !status) {
            return res.status(400).json({ message: "Valid submission id and status are required" });
        }

        const submission = await submissionService.updateStatus(
            id,
            req.user!.id,
            req.user!.role,
            status
        );
        res.status(200).json(submission);
    } catch (err) {
        sendError(res, err, "Failed to update status");
    }
}

export async function remove(req: AuthRequest, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid submission id" });
        }

        await submissionService.deleteSubmission(id, req.user!.id);
        res.status(200).json({ message: "Submission deleted" });
    } catch (err) {
        sendError(res, err, "Failed to delete submission");
    }
}