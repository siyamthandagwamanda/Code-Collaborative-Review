import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ReviewDecision } from "../models/review.model";
import * as reviewService from "../services/review.service";
import { sendError } from "../utils/send-error";

async function submitReview(req: AuthRequest, res: Response, decision: ReviewDecision) {
    try {
        const submissionId = Number(req.params.id);
        if (Number.isNaN(submissionId)) {
            return res.status(400).json({ message: "Invalid submission id" });
        }

        const raw = req.body?.feedback;
        const feedback = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;

        const review = await reviewService.reviewSubmission(
            submissionId,
            req.user!.id,
            req.user!.role,
            decision,
            feedback
        );
        res.status(201).json(review);
    } catch (err) {
        sendError(res, err, "Failed to submit review");
    }
}

export function approve(req: AuthRequest, res: Response) {
    return submitReview(req, res, "approved");
}

export function requestChanges(req: AuthRequest, res: Response) {
    return submitReview(req, res, "changes_requested");
}

export async function history(req: AuthRequest, res: Response) {
    try {
        const submissionId = Number(req.params.id);
        if (Number.isNaN(submissionId)) {
            return res.status(400).json({ message: "Invalid submission id" });
        }

        const reviews = await reviewService.getReviews(submissionId, req.user!.id);
        res.status(200).json(reviews);
    } catch (err) {
        sendError(res, err, "Failed to fetch reviews");
    }
}