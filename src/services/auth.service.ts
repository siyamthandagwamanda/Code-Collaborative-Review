import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/db";
import { User, SafeUser, UserRole} from "../models/user.modal";

const roles: UserRole[] = ["submitter", "reviewer"];

export async function registerUser( name: string, email: string, password: string, role: UserRole = "submitter"): Promise<SafeUser>{
    if (!roles.includes(role)){
        throw new Error("Role must be submitter or reviewer");
    }

    const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1", [email]
    );
    if (existing.rows.length > 0){
        throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query<SafeUser>(
        `INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, display_picture, role, created_at`,
        [name, email, passwordHash, role]
    );
    return result.rows[0];
}

export async function loginUser( email: string, password: string, role: string): Promise<{ token: string; user: SafeUser}>{
    const result = await pool.query<User>(
        `SELECT id, name, email, password_hash, display_picture, role, created_at
        FROM users WHERE email = $1`,
        [email]
    );

    if (result.rows.length === 0){
        throw new Error("Invalid email or password");
    }

    const user = result.rows[0];
    const passwordMacthes = await bcrypt.compare(password, user.password_hash);
    if (!passwordMacthes){
        throw new Error("Invalid email or password");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret){
        throw new Error("JWT secret is not configured");
    }

    let tokenExpiration = "7d";
    if (process.env.JWT_EXPIRES_IN){
        tokenExpiration = process.env.JWT_EXPIRES_IN;
    }

    const payload = {
        id: user.id,
        role: user.role
    }

    const options: jwt.SignOptions = {
        expiresIn: tokenExpiration as jwt.SignOptions["expiresIn"]
    };

    const token = jwt.sign(payload, secret, options);

    const {password_hash, ...safeUser} = user;

    return{
        token: token,
        user: safeUser
    }
}