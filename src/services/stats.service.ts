import { pool } from "../db/db";
import { MostCommentedSubmission, ProjectStats, ReviewerActivity } from "../models/stats.modal";
import { HttpError } from "../utils/http-error";
import { getProjectAccess } from "./submission.service";

export async function getProjectStats( projectId: number, userId: number ): Promise<ProjectStats> {
    const { isOwner, isMember } = await getProjectAccess(projectId, userId);
    if (!isOwner && !isMember) {
        throw new HttpError(403, "Only the project owner or its reviewers can view stats");
    }

    const countsResult = await pool.query<{ total: number; approved: number; changes_requested: number; }>(
        `SELECT COUNT(*)::int AS total,
                (COUNT(*) FILTER (WHERE status = 'approved'))::int AS approved,
                (COUNT(*) FILTER (WHERE status = 'changes_requested'))::int AS changes_requested
        FROM submissions
        WHERE project_id = $1`,
        [projectId]
    );
    const { total, approved, changes_requested } = countsResult.rows[0];

    const decided = approved + changes_requested;
    const approvedPercentage = decided === 0 ? 0 : Math.round((approved / decided) * 1000) / 10;
    const changesPercentage = decided === 0 ? 0 : Math.round((changes_requested / decided) * 1000) / 10;

   
    const timeResult = await pool.query<{ avg_seconds: number | null }>(
        `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (fr.first_review_at - s.created_at))))::int AS avg_seconds
        FROM submissions s
        JOIN (
            SELECT submission_id, MIN(created_at) AS first_review_at
            FROM reviews
            GROUP BY submission_id
        ) fr ON fr.submission_id = s.id
        WHERE s.project_id = $1`,
        [projectId]
    );
    const avgSeconds = timeResult.rows[0].avg_seconds;
    const avgHours = avgSeconds === null ? null : Math.round((avgSeconds / 3600) * 100) / 100;

    const activityResult = await pool.query<ReviewerActivity>(
        `SELECT u.id AS reviewer_id,
                u.name,
                (SELECT COUNT(*)::int FROM reviews r
                    JOIN submissions s ON s.id = r.submission_id
                    WHERE r.reviewer_id = u.id AND s.project_id = $1) AS reviews_count,
                (SELECT COUNT(*)::int FROM comments c
                    JOIN submissions s ON s.id = c.submission_id
                    WHERE c.author_id = u.id AND s.project_id = $1) AS comments_count
        FROM project_members pm
        JOIN users u ON u.id = pm.user_id
        WHERE pm.project_id = $1
        ORDER BY reviews_count DESC, comments_count DESC, u.id`,
        [projectId]
    );

   
    const mostResult = await pool.query<MostCommentedSubmission>(
        `SELECT s.id, s.title, COUNT(c.id)::int AS comment_count
        FROM submissions s
        JOIN comments c ON c.submission_id = s.id
        WHERE s.project_id = $1
        GROUP BY s.id, s.title
        ORDER BY comment_count DESC, s.id
        LIMIT 1`,
        [projectId]
    );

    return {
        project_id: projectId,
        total_submissions: total,
        approved,
        changes_requested,
        awaiting_review: total - decided,
        approved_percentage: approvedPercentage,
        changes_requested_percentage: changesPercentage,
        avg_review_time_seconds: avgSeconds,
        avg_review_time_hours: avgHours,
        reviewer_activity: activityResult.rows,
        most_commented_submission: mostResult.rows[0] ?? null
    };
}