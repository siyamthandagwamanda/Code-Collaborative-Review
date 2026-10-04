import { pool } from "../db/db";
import { SafeUser } from "../models/user.modal";

export async function getUserById(id: number): Promise<SafeUser | undefined> {
    const result = await pool.query<SafeUser>(
        `SELECT id, name, email, display_picture, role, created_at
        FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0];
}

export async function updateUser( id: number, name?: string, email?: string, displayPicture?: string): Promise<SafeUser | undefined> {
    const result = await pool.query<SafeUser>(
        `UPDATE users
        SET name = COALESCE($1, name),
            email = COALESCE($2, email),
            display_picture = COALESCE($3, display_picture)
        WHERE id = $4
        RETURNING id, name, email, display_picture, role, created_at`,
        [name ?? null, email ?? null, displayPicture ?? null, id]
    );
    return result.rows[0];
}

export async function deleteUser(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    return result.rows.length > 0;
}