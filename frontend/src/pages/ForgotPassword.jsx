import React, { useState, useRef } from "react";
import { Card, Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef([]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/auth/forgot-password", { email });
      if (data.devOtp) {
        // Email not configured — show OTP directly for dev/demo
        setOtp(data.devOtp.split(""));
        setSuccess("Email not configured. OTP pre-filled for demo.");
      } else {
        setSuccess("Reset code sent! Check your email.");
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", {
        email, otp: otp.join(""), newPassword,
      });
      setSuccess("Password reset! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="bi bi-check2-circle"></i>
          <span>TaskFlow</span>
        </div>

        <h2 className="auth-title">{step === 1 ? "Forgot Password" : "Reset Password"}</h2>
        <p className="auth-subtitle">
          {step === 1
            ? "Enter your email and we'll send a reset code"
            : <>Code sent to <strong style={{ color: "var(--text-primary)" }}>{email}</strong></>}
        </p>

        <Card>
          <Card.Body>
            {error && (
              <div className="auth-error">
                <i className="bi bi-exclamation-circle me-2"></i>{error}
              </div>
            )}
            {success && (
              <div style={{
                background: "var(--green-dim)", border: "1px solid rgba(63,185,80,0.3)",
                borderRadius: "10px", color: "var(--green)", padding: "10px 14px",
                fontSize: "0.88rem", marginBottom: "16px", display: "flex", alignItems: "center"
              }}>
                <i className="bi bi-check-circle me-2"></i>{success}
              </div>
            )}

            {step === 1 && (
              <Form onSubmit={handleSendCode}>
                <Form.Group className="mb-4">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email" placeholder="Enter your account email"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  {loading
                    ? <><i className="bi bi-arrow-clockwise me-2"></i>Sending...</>
                    : <><i className="bi bi-envelope me-2"></i>Send Reset Code</>}
                </Button>
              </Form>
            )}

            {step === 2 && (
              <Form onSubmit={handleResetPassword}>
                {/* OTP boxes */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      style={{
                        width: "46px", height: "52px", textAlign: "center",
                        fontSize: "1.4rem", fontWeight: "700",
                        background: "var(--bg-input)",
                        border: `2px solid ${digit ? "var(--red)" : "var(--border-input)"}`,
                        borderRadius: "10px", color: "var(--text-primary)",
                        outline: "none", caretColor: "var(--red)", transition: "border-color 0.2s",
                      }}
                      onFocus={e => e.target.style.borderColor = "var(--red)"}
                      onBlur={e => e.target.style.borderColor = digit ? "var(--red)" : "var(--border-input)"}
                    />
                  ))}
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password" placeholder="Enter new password (min 6 chars)"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password" placeholder="Confirm new password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100 mb-2"
                  disabled={loading || otp.join("").length < 6}>
                  {loading
                    ? <><i className="bi bi-arrow-clockwise me-2"></i>Resetting...</>
                    : <><i className="bi bi-lock me-2"></i>Reset Password</>}
                </Button>

                <button type="button" onClick={() => { setStep(1); setError(""); setSuccess(""); setOtp(["","","","","",""]); }}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.83rem", cursor: "pointer", width: "100%", textAlign: "center", padding: "4px" }}>
                  <i className="bi bi-arrow-repeat me-1"></i>Send new code
                </button>
              </Form>
            )}

            <div className="auth-divider"><span>Remember your password?</span></div>
            <Link to="/login" className="auth-link-btn">
              <i className="bi bi-arrow-left me-2"></i>Back to Login
            </Link>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default ForgotPassword;
