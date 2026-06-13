import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
} from "../controllers/authController.mjs";
import protect from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);

export default router;
