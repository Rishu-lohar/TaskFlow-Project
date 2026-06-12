import React, { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post("/api/auth/login", { email, password });
      localStorage.setItem("userInfo", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (data?.pendingVerification) {
        navigate("/verify-email", { state: { email: data.email } });
        return;
      }
      setError(data?.message || "Login failed. Please try again.");
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

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Login to continue managing your tasks</p>

        <Card>
          <Card.Body>
            <Form onSubmit={submitHandler}>
              {error && (
                <div className="auth-error">
                  <i className="bi bi-exclamation-circle me-2"></i>{error}
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                {loading
                  ? <><i className="bi bi-arrow-clockwise me-2"></i>Logging in...</>
                  : <><i className="bi bi-box-arrow-in-right me-2"></i>Login</>
                }
              </Button>
            </Form>

            <div className="auth-divider"><span>Don't have an account?</span></div>
            <Link to="/signup" className="auth-link-btn">Create a new account</Link>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default Login;
