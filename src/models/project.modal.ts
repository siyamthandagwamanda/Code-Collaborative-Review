import { SafeUser } from "./user.modal";

export interface Project {
    id: number;
    name: string;
    description: string | null;
    owner_id: number;
    created_at: Date;
}

export type ProjectMember = Pick<SafeUser, "id" | "name" | "email" | "role">;

export interface ProjectWithMembers extends Project {
    members: ProjectMember[];
}