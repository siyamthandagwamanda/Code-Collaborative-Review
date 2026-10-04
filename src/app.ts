import express  from "express";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import projectRoutes from "./routes/projects.routes";


const app = express();
app.use(express.json());

app.get("/testing", (req, res) => {
    res.status(200).json({status: "ok"})
})

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

export default app;