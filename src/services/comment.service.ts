import { pool } from "../db/db";
import { Comment, CommentWithAuthor } from "../models/comment.model";
import { UserRole } from "../models/user.modal";
import { HttpError } from "../utils/http-error";
import { findSubmission, getProjectAccess, getSubmission } from "./submission.service";
import { notify } from "./notification.service";

const COLUMNS = "id, submission_id, author_id, line_number, body, created_at";

async function findComment(id: number): Promise<Comment> {
    const result = await pool.query<Comment>(
        `SELECT ${COLUMNS} FROM comments WHERE id = $1`,
        [id]
    );
    const comment = result.rows[0];
    if (!comment) {
        throw new HttpError(404, "Comment not found");
    }
    return comment;
}

export async function addComment( submissionId: number, userId: number, role: UserRole, body: string, lineNumber: number | null ): Promise<Comment> {
    if (role !== "reviewer") {
        throw new HttpError(403, "Only reviewers can comment");
    }

    const submission = await findSubmission(submissionId);
    const { isOwner, isMember } = await getProjectAccess(submission.project_id, userId);
    if (!isOwner && !isMember) {
        throw new HttpError(403, "You are not a reviewer on this project");
    }

    const result = await pool.query<Comment>(
        `INSERT INTO comments (submission_id, author_id, line_number, body)
        VALUES ($1, $2, $3, $4)
        RETURNING ${COLUMNS}`,
        [submissionId, userId, lineNumber, body]
    );

    const comment = result.rows[0];

    if (submission.submitter_id !== userId) {
        await notify(
            [submission.submitter_id],
            `New comment on submission #${submissionId}: "${submission.title}"`
        );
    }

    return comment;
}

export async function getComments( submissionId: number, userId: number ): Promise<CommentWithAuthor[]> {
    await getSubmission(submissionId, userId); 

    const result = await pool.query<CommentWithAuthor>(
        `SELECT c.id, c.submission_id, c.author_id, c.line_number, c.body, c.created_at,
                u.name AS author_name
        FROM comments c
        JOIN users u ON u.id = c.author_id
        WHERE c.submission_id = $1
        ORDER BY c.created_at, c.id`,
        [submissionId]
    );
    return result.rows;
}

export async function updateComment( id: number, userId: number, body: string ): Promise<Comment> {
    const comment = await findComment(id);
    if (comment.author_id !== userId) {
        throw new HttpError(403, "You can only edit your own comments");
    }

    const result = await pool.query<Comment>(
        `UPDATE comments SET body = $1 WHERE id = $2 RETURNING ${COLUMNS}`,
        [body, id]
    );
    return result.rows[0];
}

export async function deleteComment(id: number, userId: number): Promise<void> {
    const comment = await findComment(id);
    const submission = await findSubmission(comment.submission_id);
    const { isOwner } = await getProjectAccess(submission.project_id, userId);

    if (comment.author_id !== userId && !isOwner) {
        throw new HttpError(403, "Only the author or project owner can delete this comment");
    }

    await pool.query("DELETE FROM comments WHERE id = $1", [id]);
}