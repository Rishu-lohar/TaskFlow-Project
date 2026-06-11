import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import ProfileDropdown from "./ProfileDropdown";
import SettingsModal from "./SettingsModal";

import "../styles/header.css";

const Header = () => {
  const navigate = useNavigate();

  const userInfo = JSON.parse(
    localStorage.getItem("userInfo") || "{}"
  );

  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [isDark, setIsDark] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("taskflow-tasks");
    navigate("/login");
  };

  const toggleTheme = () => {
    setIsDark(!isDark);

    document.documentElement.style.setProperty(
      "--bg-main",
      isDark ? "#ffffff" : "#0d1117"
    );

    document.documentElement.style.setProperty(
      "--bg-card",
      isDark ? "#f6f8fa" : "#161b22"
    );

    document.documentElement.style.setProperty(
      "--bg-input",
      isDark ? "#f0f2f5" : "#0d1117"
    );

    document.documentElement.style.setProperty(
      "--text-primary",
      isDark ? "#1a1a1a" : "#e6edf3"
    );

    document.documentElement.style.setProperty(
      "--text-secondary",
      isDark ? "#555" : "#8b949e"
    );

    document.documentElement.style.setProperty(
      "--text-muted",
      isDark ? "#888" : "#6e7681"
    );
  };

  return (
    <>
      <header className="header-wrapper">
        <Container>

          <div className="header-content">

            {/* LEFT - USER INFO */}
            <div
              className="header-user"
              onClick={() =>
                setDropdownOpen(!dropdownOpen)
              }
            >
              <div className="user-avatar-small">
                {userInfo?.name
                  ? userInfo.name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div>
                <div className="user-name">
                  {userInfo?.name || "User"}
                </div>

                <div className="user-email">
                  {userInfo?.email || ""}
                </div>
              </div>

              <ProfileDropdown
                userInfo={userInfo}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                setSettingsOpen={setSettingsOpen}
                isDark={isDark}
                toggleTheme={toggleTheme}
              />
            </div>

            {/* CENTER LOGO */}
            <div className="header-logo">
              <h1>
                <i className="bi bi-check2-circle me-2"></i>
                TaskFlow
              </h1>

              <p>
                <i className="bi bi-lightning-fill me-1"></i>
                Smart Task Manager
              </p>
            </div>

            {/* RIGHT LOGOUT */}
            <div className="header-actions">
              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </button>
            </div>

          </div>

        </Container>
      </header>

      <SettingsModal
        show={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userInfo={userInfo}
      />
    </>
  );
};

export default Header;