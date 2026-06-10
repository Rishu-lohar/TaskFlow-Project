import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.mjs";
import taskRoutes from "./routes/taskRoutes.mjs";
import {
  notFound,
  errorHandler,
} from "./middleware/errorMiddleware.mjs";

// Load environment variables from .env
dotenv.config();

// Create express application
const app = express();

// Middleware to parse JSON data
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Enable frontend-backend communication
app.use(cors());

// Use auth routes
app.use("/auth", authRoutes);


// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TaskFlow Backend Running Successfully 🚀"
  });
});


// Read PORT from .env file
const PORT = process.env.PORT || 8000;


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});