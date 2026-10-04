import { pool } from "../db/db";
import { Review, ReviewDecision, ReviewWithReviewer } from "../models/review.model";
import { UserRole } from "../models/user.modal";
import { HttpError } from "../utils/http-error";
import { findSubmission, getProjectAccess, getSubmission } from "./submission.service";

const COLUMNS = "id, submission_id, reviewer_id, status, comment, created_at";

export async function reviewSubmission( submissionId: number, userId: number, role: UserRole, decision: ReviewDecision, feedback: string | null ): Promise<Review> {
    if (role !== "reviewer") {
        throw new HttpError(403, "Only reviewers can review submissions");
    }
    if (decision === "changes_requested" && !feedback) {
        throw new HttpError(400, "Feedback is required when requesting changes");
    }

    const submission = await findSubmission(submissionId);
    const { isMember } = await getProjectAccess(submission.project_id, userId);
    if (!isMember) {
        throw new HttpError(403, "You are not a reviewer on this project");
    }
    if (submission.status === "approved") {
        throw new HttpError(409, "Submission is already approved");
    }

    const result = await pool.query<Review>(
        `INSERT INTO reviews (submission_id, reviewer_id, status, comment)
        VALUES ($1, $2, $3, $4)
        RETURNING ${COLUMNS}`,
        [submissionId, userId, decision, feedback]
    );

    await pool.query("UPDATE submissions SET status = $1 WHERE id = $2", [decision, submissionId]);

    return result.rows[0];
}

export async function getReviews( submissionId: number, userId: number ): Promise<ReviewWithReviewer[]> {
    await getSubmission(submissionId, userId); 

    const result = await pool.query<ReviewWithReviewer>(
        `SELECT r.id, r.submission_id, r.reviewer_id, r.status, r.comment, r.created_at,
                u.name AS reviewer_name
        FROM reviews r
        JOIN users u ON u.id = r.reviewer_id
        WHERE r.submission_id = $1
        ORDER BY r.created_at, r.id`,
        [submissionId]
    );
    return result.rows;
}