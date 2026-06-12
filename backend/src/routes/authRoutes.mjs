import express from "express";
import protect from "../middleware/authMiddleware.mjs";

import {
  registerUser,
  loginUser,
  deleteAccount,
} from "../controllers/authController.mjs";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.delete("/delete-account", protect, deleteAccount);

export default router;