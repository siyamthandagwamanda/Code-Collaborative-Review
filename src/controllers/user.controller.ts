import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as userService from "../services/user.service";

export async function getUser(req: AuthRequest, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user" });
    }
}

export async function updateUser(req: AuthRequest, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        if (req.user?.id !== id) {
            return res.status(403).json({ message: "You can only edit your own profile" });
        }

        const { name, email, display_picture } = req.body;
        const user = await userService.updateUser(id, name, email, display_picture);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (err: any) {
        if (err.code === "23505") {
            return res.status(409).json({ message: "Email already in use" });
        }
        res.status(500).json({ message: "Failed to update user" });
    }
}

export async function deleteUser(req: AuthRequest, res: Response) {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        if (req.user?.id !== id) {
            return res.status(403).json({ message: "You can only delete your own account" });
        }

        const deleted = await userService.deleteUser(id);
        if (!deleted) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted" });
    } catch (err: any) {
        if (err.code === "23503") {
            return res.status(409).json({ message: "User still owns projects or submissions" });
        }
        res.status(500).json({ message: "Failed to delete user" });
    }
}
