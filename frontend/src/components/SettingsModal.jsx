import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import axios from "axios";

import "../styles/settings.css";

const SettingsModal = ({
  show,
  onClose,
  userInfo,
}) => {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [pwLoading, setPwLoading] =
    useState(false);

  const [pwMsg, setPwMsg] = useState({
    text: "",
    type: "",
  });

  if (!show) return null;

  const handleChangePassword = async (
    e
  ) => {
    e.preventDefault();

    setPwMsg({
      text: "",
      type: "",
    });

    if (
      newPassword !== confirmPassword
    ) {
      return setPwMsg({
        text: "Passwords do not match",
        type: "error",
      });
    }

    try {
      setPwLoading(true);

      await axios.put(
        `${API_URL}/api/auth/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setPwMsg({
        text: "Password updated successfully",
        type: "success",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPwMsg({
        text:
          error.response?.data
            ?.message ||
          "Failed to update password",
        type: "error",
      });
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteTasks = () => {
    if (
      window.confirm(
        "Delete all tasks?"
      )
    ) {
      localStorage.removeItem(
        "taskflow-tasks"
      );

      window.location.reload();
    }
  };

  const handleDeleteAccount =
    async () => {
      if (
        !window.confirm(
          "Delete account permanently?"
        )
      )
        return;

      try {
        await axios.delete(
          `${API_URL}/api/auth/delete-account`,
          {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          }
        );

        localStorage.removeItem(
          "userInfo"
        );

        window.location.href =
          "/signup";
      } catch {
        alert(
          "Failed to delete account"
        );
      }
    };

  return (
    <div
      className="settings-overlay"
      onClick={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="settings-modal">

        <div className="settings-header">
          <div>
            <i className="bi bi-gear-fill"></i>
            Settings
          </div>

          <button
            onClick={onClose}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="settings-body">

          <div className="settings-section">
            <h6>
              Security
            </h6>

            <Form
              onSubmit={
                handleChangePassword
              }
            >
              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="Current Password"
                  value={
                    currentPassword
                  }
                  onChange={(e) =>
                    setCurrentPassword(
                      e.target.value
                    )
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="Confirm Password"
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                />
              </Form.Group>

              {pwMsg.text && (
                <div
                  className={`pw-message ${pwMsg.type}`}
                >
                  {pwMsg.text}
                </div>
              )}

              <Button
                type="submit"
                className="w-100"
                disabled={
                  pwLoading
                }
              >
                {pwLoading
                  ? "Updating..."
                  : "Update Password"}
              </Button>
            </Form>
          </div>

          <div className="settings-section">
            <h6>
              Data Management
            </h6>

            <button
              className="danger-btn-outline"
              onClick={
                handleDeleteTasks
              }
            >
              Delete All Tasks
            </button>

            <button
              className="danger-btn"
              onClick={
                handleDeleteAccount
              }
            >
              Delete Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;