import React, { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/auth/register", { name, email, password });
      if (data.token) {
        // Email not configured — user was auto-verified, log straight in
        localStorage.setItem("userInfo", JSON.stringify(data));
        navigate("/dashboard");
      } else {
        // OTP sent — go to verify page
        navigate("/verify-email", { state: { email } });
      }
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.pendingVerification) {
        navigate("/verify-email", { state: { email } });
        return;
      }
      setError(resData?.message || "Registration failed. Please try again.");
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

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Start managing your tasks smarter</p>

        <Card>
          <Card.Body>
            <Form onSubmit={submitHandler}>
              {error && (
                <div className="auth-error">
                  <i className="bi bi-exclamation-circle me-2"></i>{error}
                </div>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control type="text" placeholder="Enter your name"
                  value={name} onChange={e => setName(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control type="email" placeholder="Enter your email"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" placeholder="Create a password (min 6 chars)"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </Form.Group>
              <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                {loading
                  ? <><i className="bi bi-arrow-clockwise me-2"></i>Creating...</>
                  : <><i className="bi bi-person-plus me-2"></i>Create Account</>}
              </Button>
            </Form>
            <div className="auth-divider"><span>Already have an account?</span></div>
            <Link to="/login" className="auth-link-btn">Login to TaskFlow</Link>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default SignUp;
