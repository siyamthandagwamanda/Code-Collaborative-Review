export type UserRole = "submitter" | "reviewer";

export interface User {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    display_picture: string | null;
    role: UserRole;
    created_at: Date;
}

export type SafeUser = Omit<User, "password_hash">;