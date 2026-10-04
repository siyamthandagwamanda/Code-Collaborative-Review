import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function register(req: Request, res: Response) {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "name, email and password are required" });
        }

        const user = await authService.registerUser(name, email, password, role);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: "email and password are required" });
        }

        const result = await authService.loginUser(email, password, role);
        res.status(200).json(result);

    } catch (err) {
        res.status(401).json({ message: (err as Error).message });
    }
}