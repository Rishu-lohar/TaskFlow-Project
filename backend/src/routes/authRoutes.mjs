import express from "express";

import {
  registerUser,
  loginUser,
} from "../controllers/authController.mjs";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.delete("/delete-account", protect, deleteAccount);

export default router;