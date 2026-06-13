import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.mjs";

import authRoutes from "./src/routes/authRoutes.mjs";
import taskRoutes from "./src/routes/taskRoutes.mjs";
import noteRoutes from "./src/routes/noteRoutes.mjs";
import { notFound, errorHandler } from "./src/middleware/errorMiddleware.mjs";
import { startDeadlineReminder } from "./src/jobs/deadlineReminder.mjs";

import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: true, methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notes", noteRoutes);

app.get("/", (req, res) => res.json({ success: true, message: "TaskFlow Backend Running 🚀" }));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, "localhost", () => {
  console.log(`Server running on port ${PORT}`);
  startDeadlineReminder();
});
