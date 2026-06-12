import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendOtp,
  changePassword,
  deleteAccount,
} from "../controllers/authController.mjs";
import protect from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteAccount);

export default router;
