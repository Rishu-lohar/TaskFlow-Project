import React, { useEffect, useRef } from "react";
import "../styles/dropdown.css";

const ProfileDropdown = ({
  userInfo,
  dropdownOpen,
  setDropdownOpen,
  setSettingsOpen,
  isDark,
  toggleTheme,
  handleLogout,
}) => {
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handler);
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handler
      );
    };
  }, [dropdownOpen,setDropdownOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`profile-dropdown ${
        dropdownOpen ? "show" : ""
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar">
          {userInfo?.name
            ? userInfo.name.charAt(0).toUpperCase()
            : "?"}
        </div>

        <div className="profile-name">
          {userInfo?.name || "User"}
        </div>

        <div className="profile-email">
          {userInfo?.email || ""}
        </div>
      </div>

      {/* Menu */}
      <div className="dropdown-menu-content">

        {/* Theme */}
        <button
          className="dropdown-item-btn"
          onClick={toggleTheme}
        >
          <i
            className={`bi ${
              isDark
                ? "bi-sun-fill"
                : "bi-moon-fill"
            }`}
            style={{
              color: isDark
                ? "#f59e0b"
                : "var(--blue)",
            }}
          />

          <span>
            {isDark
              ? "Switch to Light"
              : "Switch to Dark"}
          </span>

          <span className="theme-badge">
            {isDark ? "Dark" : "Light"}
          </span>
        </button>

        {/* Settings */}
        <button
          className="dropdown-item-btn"
          onClick={() => {
            setDropdownOpen(false);
            setSettingsOpen(true);
          }}
        >
          <i className="bi bi-gear"></i>

          <span>Settings</span>

          <i
            className="bi bi-chevron-right"
            style={{
              marginLeft: "auto",
              fontSize: "0.75rem",
            }}
          />
        </button>

        <div className="dropdown-divider"></div>

        {/* Logout */}
        <button
          className="dropdown-item-btn logout"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i>

          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;