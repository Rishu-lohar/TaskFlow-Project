import express from "express";

import {
  registerUser,
  loginUser,
  deleteAccount,
} from "../controllers/authController.mjs";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.delete("/delete-account", deleteAccount);

export default router;