import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.mjs";
import Task from "../models/Task.mjs";
import generateToken from "../utils/generateToken.mjs";
import { sendVerificationEmail } from "../utils/emailService.mjs";

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// REGISTER — creates unverified user, sends OTP
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.isVerified) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      // Resend OTP for unverified account
      const otp = generateOtp();
      existing.verifyOtp = otp;
      existing.verifyOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await existing.save();
      await sendVerificationEmail(email, existing.name, otp);
      return res.status(200).json({ message: "OTP resent", email, pendingVerification: true });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();

    await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verifyOtp: otp,
      verifyOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendVerificationEmail(email, name, otp);

    res.status(201).json({ message: "OTP sent", email, pendingVerification: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY EMAIL — checks OTP, marks verified, returns JWT
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.verifyOtpExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please sign up again to get a new code." });
    }

    user.isVerified = true;
    user.verifyOtp = null;
    user.verifyOtpExpiry = null;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
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

    await sendVerificationEmail(email, user.name, otp);
    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN — only verified accounts
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      // Resend OTP and prompt verification
      const otp = generateOtp();
      user.verifyOtp = otp;
      user.verifyOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(email, user.name, otp);
      return res.status(403).json({
        message: "Email not verified. A new code has been sent to your email.",
        email,
        pendingVerification: true,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
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
