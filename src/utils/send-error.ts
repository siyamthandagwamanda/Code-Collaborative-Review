import { Response } from "express";
import { HttpError } from "./http-error";

export function sendError(res: Response, err: unknown, fallback: string) {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
    }
    res.status(500).json({ message: fallback });
}