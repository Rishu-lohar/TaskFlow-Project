import express from "express";
import {
  registerUser,
  loginUser,
  changePassword,
  deleteAccount,
} from "../controllers/authController.mjs";
import protect from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);

export default router;