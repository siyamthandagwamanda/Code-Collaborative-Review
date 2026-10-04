import { pool } from "../db/db";
import { Submission, SubmissionStatus, submission_statuses } from "../models/submission.model";
import { UserRole } from "../models/user.modal";
import { HttpError } from "../utils/http-error";

const COLUMNS = "id, project_id, submitter_id, title, code, status, created_at";

async function getProjectAccess(projectId: number, userId: number) {
    const projectResult = await pool.query<{ owner_id: number }>(
        "SELECT owner_id FROM projects WHERE id = $1",
        [projectId]
    );
    const project = projectResult.rows[0];
    if (!project) {
        throw new HttpError(404, "Project not found");
    }

    const memberResult = await pool.query(
        "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
        [projectId, userId]
    );

    return {
        isOwner: project.owner_id === userId,
        isMember: memberResult.rows.length > 0
    };
}

async function findSubmission(id: number): Promise<Submission> {
    const result = await pool.query<Submission>(
        `SELECT ${COLUMNS} FROM submissions WHERE id = $1`,
        [id]
    );
    const submission = result.rows[0];
    if (!submission) {
        throw new HttpError(404, "Submission not found");
    }
    return submission;
}

export async function createSubmission( projectId: number, userId: number, role: UserRole, title: string, code: string ): Promise<Submission> {
    if (role !== "submitter") {
        throw new HttpError(403, "Only submitters can create submissions");
    }

    await getProjectAccess(projectId, userId);

    const result = await pool.query<Submission>(
        `INSERT INTO submissions (project_id, submitter_id, title, code)
        VALUES ($1, $2, $3, $4)
        RETURNING ${COLUMNS}`,
        [projectId, userId, title, code]
    );
    return result.rows[0];
}

export async function getSubmissionsByProject( projectId: number, userId: number ): Promise<Submission[]> {
    const { isOwner, isMember } = await getProjectAccess(projectId, userId);

    if (isOwner || isMember) {
        const all = await pool.query<Submission>(
            `SELECT ${COLUMNS} FROM submissions WHERE project_id = $1 ORDER BY id`,
            [projectId]
        );
        return all.rows;
    }

    const own = await pool.query<Submission>(
        `SELECT ${COLUMNS} FROM submissions
        WHERE project_id = $1 AND submitter_id = $2 ORDER BY id`,
        [projectId, userId]
    );
    return own.rows;
}

export async function getSubmission(id: number, userId: number): Promise<Submission> {
    const submission = await findSubmission(id);
    const { isOwner, isMember } = await getProjectAccess(submission.project_id, userId);

    if (submission.submitter_id !== userId && !isOwner && !isMember) {
        throw new HttpError(403, "You do not have access to this submission");
    }
    return submission;
}

export async function updateStatus( id: number, userId: number, role: UserRole, status: SubmissionStatus ): Promise<Submission> {
    if (!submission_statuses.includes(status)) {
        throw new HttpError(400, `Status must be one of: ${submission_statuses.join(", ")}`);
    }
    if (role !== "reviewer") {
        throw new HttpError(403, "Only reviewers can change the status");
    }

    const submission = await findSubmission(id);
    const { isMember } = await getProjectAccess(submission.project_id, userId);
    if (!isMember) {
        throw new HttpError(403, "You are not a reviewer on this project");
    }

    const result = await pool.query<Submission>(
        `UPDATE submissions SET status = $1 WHERE id = $2 RETURNING ${COLUMNS}`,
        [status, id]
    );
    return result.rows[0];
}

export async function deleteSubmission(id: number, userId: number): Promise<void> {
    const submission = await findSubmission(id);
    const { isOwner } = await getProjectAccess(submission.project_id, userId);

    if (submission.submitter_id !== userId && !isOwner) {
        throw new HttpError(403, "Only the submitter or project owner can delete this");
    }

    
    await pool.query("DELETE FROM comments WHERE submission_id = $1", [id]);
    await pool.query("DELETE FROM submissions WHERE id = $1", [id]);
}