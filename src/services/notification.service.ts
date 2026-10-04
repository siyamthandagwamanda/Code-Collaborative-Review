import { pool } from "../db/db";
import { AppNotification } from "../models/notification.model";
import { HttpError } from "../utils/http-error";

const COLUMNS = "id, user_id, message, is_read, created_at";

export async function createNotification( userId: number, message: string ): Promise<AppNotification> {
    const result = await pool.query<AppNotification>(
        `INSERT INTO notifications (user_id, message)
        VALUES ($1, $2)
        RETURNING ${COLUMNS}`,
        [userId, message]
    );
    return result.rows[0];
}


export async function notify(userIds: number[], message: string): Promise<void> {
    try {
        for (const userId of userIds) {
            await createNotification(userId, message);
        }
    } catch (err) {
        console.error("Failed to create notification:", err);
    }
}

export async function notifyProjectTeam( projectId: number, excludeUserId: number, message: string ): Promise<void> {
    try {
        const result = await pool.query<{ user_id: number }>(
            `SELECT owner_id AS user_id FROM projects WHERE id = $1
            UNION
            SELECT user_id FROM project_members WHERE project_id = $1`,
            [projectId]
        );

        const userIds = result.rows
            .map((row) => row.user_id)
            .filter((id) => id !== excludeUserId);

        for (const userId of userIds) {
            await createNotification(userId, message);
        }
    } catch (err) {
        console.error("Failed to notify project team:", err);
    }
}

export async function getNotifications( requestedUserId: number, userId: number ): Promise<AppNotification[]> {
    if (requestedUserId !== userId) {
        throw new HttpError(403, "You can only view your own notifications");
    }

    const result = await pool.query<AppNotification>(
        `SELECT ${COLUMNS} FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 50`,
        [userId]
    );
    return result.rows;
}