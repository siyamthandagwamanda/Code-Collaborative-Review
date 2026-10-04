import { pool } from "../db/db";
import { Project, ProjectMember, ProjectWithMembers } from "../models/project.modal";
import { getUserById } from "./user.service";
import { HttpError } from "../utils/http-error";

export async function createProject( name: string, description: string | null, ownerId: number ): Promise<Project> {
    const result = await pool.query<Project>(
        `INSERT INTO projects (name, description, owner_id)
        VALUES ($1, $2, $3)
        RETURNING id, name, description, owner_id, created_at`,
        [name, description, ownerId]
    );
    return result.rows[0];
}

export async function getAllProjects(userId: number): Promise<ProjectWithMembers[]> {
    const projectsResult = await pool.query<Project>(
        `SELECT id, name, description, owner_id, created_at
        FROM projects
        WHERE owner_id = $1
           OR id IN (SELECT project_id FROM project_members WHERE user_id = $1)
        ORDER BY id`,
        [userId]
    );

    const projectsWithMembers: ProjectWithMembers[] = [];

    for (const project of projectsResult.rows) {
        const membersResult = await pool.query<ProjectMember>(
            `SELECT u.id, u.name, u.email, u.role
            FROM project_members pm
            JOIN users u ON u.id = pm.user_id
            WHERE pm.project_id = $1`,
            [project.id]
        );
        projectsWithMembers.push({ ...project, members: membersResult.rows });
    }

    return projectsWithMembers;
}

async function getOwnedProject(projectId: number, userId: number): Promise<Project> {
    const result = await pool.query<Project>(
        `SELECT id, name, description, owner_id, created_at
        FROM projects WHERE id = $1`,
        [projectId]
    );

    const project = result.rows[0];
    if (!project) {
        throw new HttpError(404, "Project not found");
    }
    if (project.owner_id !== userId) {
        throw new HttpError(403, "Only the project owner can do this");
    }
    return project;
}

export async function addMember( projectId: number, requesterId: number, userId: number): Promise<ProjectMember> {

    await getOwnedProject(projectId, requesterId);

    const user = await getUserById(userId);
    if (!user) {
        throw new HttpError(404, "User not found");
    }
    if (user.role !== "reviewer") {
        throw new HttpError(400, "Only reviewers can be assigned to a project");
    }

    const existing = await pool.query(
        "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
        [projectId, userId]
    );
    if (existing.rows.length > 0) {
        throw new HttpError(409, "User is already a member of this project");
    }

    await pool.query(
        "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
        [projectId, userId]
    );

    return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function removeMember( projectId: number, requesterId: number, userId: number ): Promise<void> {
    
    await getOwnedProject(projectId, requesterId);

    const result = await pool.query(
        "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id",
        [projectId, userId]
    );
    if (result.rows.length === 0) {
        throw new HttpError(404, "User is not a member of this project");
    }
}