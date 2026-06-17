import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, Button } from "react-bootstrap";
import api from "../api";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/auth/verify-email", { email, otp: code });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setSuccess("Email verified! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/auth/resend-otp", { email });
      setSuccess("A new code has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="bi bi-check2-circle"></i>
          <span>TaskFlow</span>
        </div>

        <h2 className="auth-title">Verify your email</h2>
        <p className="auth-subtitle">
          We sent a 6-digit code to<br />
          <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
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

            {/* OTP Input boxes */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "24px" }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  style={{
                    width: "48px", height: "56px",
                    textAlign: "center", fontSize: "1.5rem", fontWeight: "700",
                    background: "var(--bg-input)",
                    border: `2px solid ${digit ? "var(--blue)" : "var(--border-input)"}`,
                    borderRadius: "10px", color: "var(--text-primary)",
                    outline: "none", caretColor: "var(--blue)",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--blue)"}
                  onBlur={e => e.target.style.borderColor = digit ? "var(--blue)" : "var(--border-input)"}
                />
              ))}
            </div>

            <Button
              variant="primary"
              className="w-100 mb-3"
              onClick={handleVerify}
              disabled={loading || otp.join("").length < 6}
            >
              {loading
                ? <><i className="bi bi-arrow-clockwise me-2"></i>Verifying...</>
                : <><i className="bi bi-shield-check me-2"></i>Verify Email</>
              }
            </Button>

            <div style={{ textAlign: "center" }}>
              {countdown > 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                  Resend code in <strong style={{ color: "var(--text-secondary)" }}>{countdown}s</strong>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  style={{
                    background: "transparent", border: "none",
                    color: "var(--blue)", fontSize: "0.88rem",
                    fontWeight: "600", cursor: "pointer", padding: "4px 8px",
                  }}
                >
                  {resendLoading
                    ? <><i className="bi bi-arrow-clockwise me-2"></i>Sending...</>
                    : <><i className="bi bi-arrow-repeat me-2"></i>Resend code</>
                  }
                </button>
              )}
            </div>

            <div style={{
              marginTop: "16px", textAlign: "center",
              paddingTop: "16px", borderTop: "1px solid var(--border)"
            }}>
              <button
                onClick={() => navigate("/signup")}
                style={{
                  background: "transparent", border: "none",
                  color: "var(--text-muted)", fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Back to Sign Up
              </button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default VerifyEmail;
