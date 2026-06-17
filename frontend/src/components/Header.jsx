import { useState, useEffect, useRef } from "react";
import { Container } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

import ProfileDropdown from "./ProfileDropdown";
import SettingsModal from "./SettingsModal";
import "../styles/header.css";

const applyTheme = (dark) => {
  const r = document.documentElement;
  if (dark) {
    r.style.setProperty('--bg-main',       '#0d1117');
    r.style.setProperty('--bg-card',       '#161b22');
    r.style.setProperty('--bg-card-hover', '#1c2230');
    r.style.setProperty('--bg-input',      '#0d1117');
    r.style.setProperty('--bg-tag',        '#1e2a3a');
    r.style.setProperty('--border',        'rgba(48,64,88,0.8)');
    r.style.setProperty('--border-input',  'rgba(48,64,88,0.9)');
    r.style.setProperty('--border-hover',  'rgba(96,165,250,0.4)');
    r.style.setProperty('--text-primary',  '#e6edf3');
    r.style.setProperty('--text-secondary','#8b949e');
    r.style.setProperty('--text-muted',    '#6e7681');
  } else {
    r.style.setProperty('--bg-main',       '#f6f8fa');
    r.style.setProperty('--bg-card',       '#ffffff');
    r.style.setProperty('--bg-card-hover', '#f0f2f5');
    r.style.setProperty('--bg-input',      '#f0f2f5');
    r.style.setProperty('--bg-tag',        '#e2e8f0');
    r.style.setProperty('--border',        'rgba(0,0,0,0.1)');
    r.style.setProperty('--border-input',  'rgba(0,0,0,0.15)');
    r.style.setProperty('--border-hover',  'rgba(88,166,255,0.5)');
    r.style.setProperty('--text-primary',  '#0f172a');
    r.style.setProperty('--text-secondary','#475569');
    r.style.setProperty('--text-muted',    '#94a3b8');
  }
};

const Header = ({ onTasksCleared }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const avatarRef  = useRef(null);   // passed to ProfileDropdown to exclude from outside-click

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("taskflow-theme");
    return saved !== null ? saved === "dark" : true;
  });

  useEffect(() => { applyTheme(isDark); }, [isDark]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem("taskflow-theme", next ? "dark" : "light");
      return next;
    });
  };

  // Toggle dropdown on avatar click; the trigger ref is excluded from the
  // ProfileDropdown's outside-click handler so there's no double-toggle race.
  const handleAvatarClick = (e) => {
    e.stopPropagation();
    setDropdownOpen(p => !p);
  };

  const isNotes = location.pathname === "/notes";

  return (
    <>
      <header className="taskflow-header">
        <Container>
          <div className="header-content">

            {/* LEFT — avatar + user info */}
            <div className="header-user" ref={avatarRef} onClick={handleAvatarClick}>
              <div className="user-avatar-small">
                {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="header-user-text">
                <div className="user-name">{userInfo?.name || "User"}</div>
                <div className="user-email">{userInfo?.email || ""}</div>
              </div>
              <ProfileDropdown
                userInfo={userInfo}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                setSettingsOpen={setSettingsOpen}
                isDark={isDark}
                toggleTheme={toggleTheme}
                handleLogout={handleLogout}
                triggerRef={avatarRef}
              />
            </div>

            {/* CENTER — logo + Tasks/Notes pills */}
            <div className="header-logo">
              <h1><i className="bi bi-check2-circle me-2" />TaskFlow</h1>
              <div className="header-nav">
                <button
                  className={`header-nav-pill ${!isNotes ? "active" : ""}`}
                  onClick={() => navigate("/dashboard")}
                >
                  <i className="bi bi-kanban me-1" />Tasks
                </button>
                <button
                  className={`header-nav-pill ${isNotes ? "active" : ""}`}
                  onClick={() => navigate("/notes")}
                >
                  <i className="bi bi-journal-text me-1" />Notes
                </button>
              </div>
            </div>

            {/* RIGHT — logout */}
            <div className="header-actions">
              <button className="logout-btn" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2" />
                <span className="logout-text">Logout</span>
              </button>
            </div>

          </div>
        </Container>
      </header>

      <SettingsModal
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        userInfo={userInfo}
        onTasksCleared={onTasksCleared}
      />
    </>
  );
};

export default Header;
