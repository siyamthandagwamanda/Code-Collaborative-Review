import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as projectService from "../services/project.service";
import { HttpError } from "../utils/http-error";

function sendError(res: Response, err: unknown, fallback: string) {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
    }
    res.status(500).json({ message: fallback });
}

export async function create(req: AuthRequest, res: Response) {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "name is required" });
        }

        const project = await projectService.createProject(
            name,
            description ?? null,
            req.user!.id
        );
        res.status(201).json(project);
    } catch (err) {
        sendError(res, err, "Failed to create project");
    }
}

export async function list(req: AuthRequest, res: Response) {
    try {
        const projects = await projectService.getAllProjects(req.user!.id);
        res.status(200).json(projects);
    } catch (err) {
        sendError(res, err, "Failed to fetch projects");
    }
}

export async function addMember(req: AuthRequest, res: Response) {
    try {
        const projectId = Number(req.params.id);
        const userId = Number(req.body.user_id);

        if (Number.isNaN(projectId) || Number.isNaN(userId)) {
            return res.status(400).json({ message: "Valid project id and user_id are required" });
        }

        const member = await projectService.addMember(projectId, req.user!.id, userId);
        res.status(201).json(member);
    } catch (err) {
        sendError(res, err, "Failed to add member");
    }
}

export async function removeMember(req: AuthRequest, res: Response) {
    try {
        const projectId = Number(req.params.id);
        const userId = Number(req.params.userId);

        if (Number.isNaN(projectId) || Number.isNaN(userId)) {
            return res.status(400).json({ message: "Invalid project id or user id" });
        }

        await projectService.removeMember(projectId, req.user!.id, userId);
        res.status(200).json({ message: "Member removed" });
    } catch (err) {
        sendError(res, err, "Failed to remove member");
    }
}