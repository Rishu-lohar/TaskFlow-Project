import bcrypt from "bcryptjs";
import User from "../models/User.mjs";
import Task from "../models/Task.mjs";
import generateToken from "../utils/generateToken.mjs";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailService.mjs";

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// REGISTER — creates user, sends OTP (auto-verifies if email not configured)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.isVerified)
        return res.status(400).json({ message: "An account with this email already exists" });

      // Resend OTP for unverified account
      const otp = generateOtp();
      existing.verifyOtp = otp;
      existing.verifyOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await existing.save();

      const emailSent = await trySendEmail(() => sendVerificationEmail(email, existing.name, otp), otp);
      if (!emailSent) {
        existing.isVerified = true;
        existing.verifyOtp = null;
        existing.verifyOtpExpiry = null;
        await existing.save();
        return res.status(200).json({
          _id: existing._id, name: existing.name, email: existing.email,
          token: generateToken(existing._id),
        });
      }
      return res.status(200).json({ message: "OTP resent", email, pendingVerification: true });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();

    const user = await User.create({
      name, email, password: hashedPassword,
      isVerified: false,
      verifyOtp: otp,
      verifyOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    const emailSent = await trySendEmail(() => sendVerificationEmail(email, name, otp), otp);
    if (!emailSent) {
      // Email not configured — auto-verify so app still works
      user.isVerified = true;
      user.verifyOtp = null;
      user.verifyOtpExpiry = null;
      await user.save();
      return res.status(201).json({
        _id: user._id, name: user.name, email: user.email,
        token: generateToken(user._id),
      });
    }

    res.status(201).json({ message: "OTP sent", email, pendingVerification: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });
    if (!user.verifyOtp || user.verifyOtp !== otp)
      return res.status(400).json({ message: "Invalid verification code" });
    if (new Date() > user.verifyOtpExpiry)
      return res.status(400).json({ message: "Code expired. Request a new one." });

    user.isVerified = true;
    user.verifyOtp = null;
    user.verifyOtpExpiry = null;
    await user.save();

    res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESEND OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    const otp = generateOtp();
    user.verifyOtp = otp;
    user.verifyOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailSent = await trySendEmail(() => sendVerificationEmail(email, user.name, otp), otp);
    if (!emailSent) {
      user.isVerified = true;
      user.verifyOtp = null;
      user.verifyOtpExpiry = null;
      await user.save();
      return res.json({ autoVerified: true, _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
    }

    res.json({ message: "Verification code resent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isVerified) {
      const otp = generateOtp();
      user.verifyOtp = otp;
      user.verifyOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const emailSent = await trySendEmail(() => sendVerificationEmail(email, user.name, otp), otp);
      if (!emailSent) {
        user.isVerified = true;
        user.verifyOtp = null;
        user.verifyOtpExpiry = null;
        await user.save();
        return res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
      }
      return res.status(403).json({
        message: "Email not verified. A new code has been sent.",
        email, pendingVerification: true,
      });
    }

    res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FORGOT PASSWORD — send reset OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Always respond with success to prevent email enumeration
    if (!user) return res.json({ message: "If that email exists, a reset code has been sent." });

    const otp = generateOtp();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailSent = await trySendEmail(() => sendPasswordResetEmail(email, user.name, otp), otp);
    if (!emailSent) {
      // Return OTP directly if email not configured (dev mode)
      return res.json({ message: "Email not configured.", devOtp: otp, email });
    }

    res.json({ message: "Reset code sent to your email.", email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD — verify OTP and set new password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "All fields are required" });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.resetOtp || user.resetOtp !== otp)
      return res.status(400).json({ message: "Invalid reset code" });
    if (new Date() > user.resetOtpExpiry)
      return res.status(400).json({ message: "Reset code expired. Request a new one." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.isVerified = true;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await Task.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: try to send email, returns false if it fails
async function trySendEmail(fn, otp) {
  try {
    await fn();
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send email:", err.message);
    console.warn("[Email] OTP (dev fallback):", otp);
    return false;
  }
}
