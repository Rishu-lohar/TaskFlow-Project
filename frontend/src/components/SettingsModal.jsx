import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import "../styles/settings.css";

// ✅ API URL defined here
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SettingsModal = ({ settingsOpen, setSettingsOpen }) => {

  const userInfo = JSON.parse(
    localStorage.getItem("userInfo") || "{}"
  );

  const [activeSection, setActiveSection] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text: "", type: "" });

  const handleClose = () => {
    setSettingsOpen(false);
    setActiveSection(null);
    setPwMsg({ text: "", type: "" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ text: "", type: "" });

    if (newPassword !== confirmPassword) {
      setPwMsg({ text: "Passwords do not match", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ text: "Minimum 6 characters required", type: "error" });
      return;
    }

    setPwLoading(true);
    try {
      await axios.put(
        `${API_URL}/api/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      setPwMsg({ text: "Password updated successfully!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPwMsg({
        text: error.response?.data?.message || "Failed to update password",
        type: "error"
      });
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteTasks = () => {
    if (window.confirm("Delete all tasks? This cannot be undone.")) {
      localStorage.removeItem("taskflow-tasks");
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;

    try {
      await axios.delete(
        `${API_URL}/api/auth/delete-account`,
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      localStorage.removeItem("userInfo");
      localStorage.removeItem("taskflow-tasks");
      window.location.href = "/signup";
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to delete account"
      );
    }
  };

  if (!settingsOpen) return null;

  return (
    <div
      className="settings-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="settings-modal">

        {/* ── Header ── */}
        <div className="settings-header">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            {activeSection && (
              <button
                className="settings-back-btn"
                onClick={() => {
                  setActiveSection(null);
                  setPwMsg({ text: "", type: "" });
                }}
              >
                <i className="bi bi-arrow-left" />
              </button>
            )}
            <i className="bi bi-gear-fill"
              style={{ color: "var(--blue)", fontSize: "1.1rem" }}
            />
            <span className="settings-title">
              {activeSection === "password" && "Change Password"}
              {activeSection === "deleteTasks" && "Delete Tasks"}
              {activeSection === "deleteAccount" && "Delete Account"}
              {!activeSection && "Settings"}
            </span>
          </div>

          <button className="settings-close-btn" onClick={handleClose}>
            <i className="bi bi-x" />
          </button>
        </div>

        {/* ══════════════════
            MAIN MENU
        ══════════════════ */}
        {!activeSection && (
          <div className="settings-body">

            <div className="settings-section-label">
              <i className="bi bi-shield-lock me-1" />
              Security
            </div>

            <button
              className="settings-menu-item"
              onClick={() => setActiveSection("password")}
            >
              <div className="settings-menu-icon blue">
                <i className="bi bi-key" />
              </div>
              <div className="settings-menu-text">
                <div className="settings-menu-title">Change Password</div>
                <div className="settings-menu-desc">Update your account password</div>
              </div>
              <i className="bi bi-chevron-right settings-menu-arrow" />
            </button>

            <div className="settings-divider" />

            <div className="settings-section-label">
              <i className="bi bi-database me-1" />
              Data Management
            </div>

            <button
              className="settings-menu-item"
              onClick={() => setActiveSection("deleteTasks")}
            >
              <div className="settings-menu-icon amber">
                <i className="bi bi-trash" />
              </div>
              <div className="settings-menu-text">
                <div className="settings-menu-title">Delete All Tasks</div>
                <div className="settings-menu-desc">Permanently remove all tasks</div>
              </div>
              <i className="bi bi-chevron-right settings-menu-arrow" />
            </button>

            <button
              className="settings-menu-item"
              onClick={() => setActiveSection("deleteAccount")}
            >
              <div className="settings-menu-icon red">
                <i className="bi bi-person-x" />
              </div>
              <div className="settings-menu-text">
                <div className="settings-menu-title"
                  style={{ color: "var(--red)" }}
                >
                  Delete Account
                </div>
                <div className="settings-menu-desc">
                  Permanently delete your account
                </div>
              </div>
              <i className="bi bi-chevron-right settings-menu-arrow" />
            </button>

          </div>
        )}

        {/* ══════════════════
            CHANGE PASSWORD
        ══════════════════ */}
        {activeSection === "password" && (
          <div className="settings-body">
            <Form onSubmit={handleChangePassword}>

              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {pwMsg.text && (
                <div className={`settings-msg ${pwMsg.type}`}>
                  <i className={`bi me-2 ${pwMsg.type === "success"
                    ? "bi-check-circle"
                    : "bi-exclamation-circle"}`}
                  />
                  {pwMsg.text}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-100"
                disabled={pwLoading}
              >
                {pwLoading
                  ? <><i className="bi bi-arrow-clockwise me-2" />Updating...</>
                  : <><i className="bi bi-check-lg me-2" />Update Password</>
                }
              </Button>

            </Form>
          </div>
        )}

        {/* ══════════════════
            DELETE TASKS
        ══════════════════ */}
        {activeSection === "deleteTasks" && (
          <div className="settings-body">
            <div className="settings-danger-card amber">
              <i className="bi bi-exclamation-triangle"
                style={{
                  fontSize: "2rem",
                  color: "var(--amber)",
                  marginBottom: "12px"
                }}
              />
              <div style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "1rem",
                marginBottom: "8px"
              }}>
                Delete All Tasks?
              </div>
              <div style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                marginBottom: "20px"
              }}>
                This will permanently remove all your tasks.
                This action cannot be undone.
              </div>
              <button
                className="settings-danger-btn amber"
                onClick={handleDeleteTasks}
              >
                <i className="bi bi-trash me-2" />
                Yes, Delete All Tasks
              </button>
              <button
                className="settings-cancel-btn"
                onClick={() => setActiveSection(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════
            DELETE ACCOUNT
        ══════════════════ */}
        {activeSection === "deleteAccount" && (
          <div className="settings-body">
            <div className="settings-danger-card red">
              <i className="bi bi-person-x-fill"
                style={{
                  fontSize: "2rem",
                  color: "var(--red)",
                  marginBottom: "12px"
                }}
              />
              <div style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "1rem",
                marginBottom: "8px"
              }}>
                Delete Account?
              </div>
              <div style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                marginBottom: "20px"
              }}>
                Your account and all data will be permanently deleted.
                You cannot recover this account after deletion.
              </div>
              <button
                className="settings-danger-btn red"
                onClick={handleDeleteAccount}
              >
                <i className="bi bi-person-x me-2" />
                Yes, Delete My Account
              </button>
              <button
                className="settings-cancel-btn"
                onClick={() => setActiveSection(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsModal;