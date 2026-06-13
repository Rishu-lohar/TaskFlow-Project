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
  triggerRef,          // ref to the avatar element in Header (excluded from outside-click)
}) => {
  const dropdownRef = useRef(null);

  // Close on outside click (excluding the trigger avatar)
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      const insideDropdown = dropdownRef.current?.contains(e.target);
      const insideTrigger  = triggerRef?.current?.contains(e.target);
      if (!insideDropdown && !insideTrigger) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen, setDropdownOpen, triggerRef]);

  // Close on ESC
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => { if (e.key === "Escape") setDropdownOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dropdownOpen, setDropdownOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`profile-dropdown ${dropdownOpen ? "show" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Profile card */}
      <div className="profile-card">
        <div className="profile-avatar">
          {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : "?"}
        </div>
        <div className="profile-name">{userInfo?.name || "User"}</div>
        <div className="profile-email">{userInfo?.email || ""}</div>
      </div>

      {/* Menu */}
      <div className="dropdown-menu-content">
        {/* Theme toggle */}
        <button className="dropdown-item-btn" onClick={toggleTheme}>
          <i
            className={`bi ${isDark ? "bi-sun-fill" : "bi-moon-fill"}`}
            style={{ color: isDark ? "#f59e0b" : "var(--blue)" }}
          />
          <span>{isDark ? "Switch to Light" : "Switch to Dark"}</span>
          <span className="theme-badge">{isDark ? "Dark" : "Light"}</span>
        </button>

        {/* Settings */}
        <button
          className="dropdown-item-btn"
          onClick={() => { setDropdownOpen(false); setSettingsOpen(true); }}
        >
          <i className="bi bi-gear" />
          <span>Settings</span>
          <i className="bi bi-chevron-right" style={{ marginLeft: "auto", fontSize: "0.75rem" }} />
        </button>

        <div className="dropdown-divider" />

        {/* Logout */}
        <button className="dropdown-item-btn logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
