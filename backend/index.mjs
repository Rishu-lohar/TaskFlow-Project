import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.mjs";

import authRoutes from "./src/routes/authRoutes.mjs";
import taskRoutes from "./src/routes/taskRoutes.mjs";
import {
  notFound,
  errorHandler,
} from "./src/middleware/errorMiddleware.mjs";

import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ✅ CORS must be FIRST — before any routes
app.use(cors({
  origin: ["https://task-flow-project-mocha.vercel.app"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ✅ Parse JSON — before routes
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TaskFlow Backend Running Successfully 🚀"
  });
});

// Error handlers — always last
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});