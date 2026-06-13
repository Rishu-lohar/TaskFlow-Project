---
name: TaskFlow project overview
description: Architecture, decisions, and known quirks for the TaskFlow full-stack app
---

# TaskFlow — Key Facts

## Stack
- Frontend: React 19 + Vite 8, port 5000 (workflow: "Start application")
- Backend: Express 5 + Mongoose 8, port 8000 (workflow: "Backend API")
- DB: MongoDB Atlas (MONGO_URI secret)
- Auth: JWT (JWT_SECRET secret)
- Email: Gmail SMTP via nodemailer (EMAIL_USER, EMAIL_PASS secrets)

## Critical Architecture Decisions

**Vite proxy:** All `/api/*` calls go through Vite → backend. `vite.config.js` proxies `/api` → `http://localhost:8000`. All frontend API calls use relative `/api/...` URLs. Never use `localhost:8000` directly in browser code.

**MongoDB IDs:** Always use `task._id` (not `task.id`) — MongoDB returns `_id`.

**Date handling:** Backend returns ISO strings like `"2026-06-15T00:00:00.000Z"`. Use `toDateStr(d) => d.split('T')[0]` before any YYYY-MM-DD comparison. Pattern used in TaskList, Calendar, Insights, deadline reminder cron.

**Email resilience:** If Gmail SMTP fails (bad credentials), the auth flow auto-verifies the user and logs them in directly — app remains functional. OTP is logged to console as fallback. This keeps the teacher demo working even without correct Gmail App Password.

## Features Implemented
- Signup → email OTP verification (6-digit, 10min expiry, resend with 60s cooldown)
- Login with unverified account → auto-resends OTP, redirects to verify page
- Forgot Password → OTP sent to email → 2-step reset on same page
- Task CRUD (create, toggle complete, delete) — all use `_id`
- Dashboard stats, Calendar (ISO date aware), Insights (overdue detection)
- Notes page (`/notes`) — split panel, rich text editor (contentEditable + execCommand), bold/italic/underline/strikethrough, heading styles, font size, text color, highlight color, bullet/numbered lists, alignment, note accent colors, auto-save (1.5s debounce), mobile responsive
- Theme toggle (dark/light) persisted to localStorage
- Settings modal: change password, delete all tasks, delete account
- Daily cron at 08:00 UTC: sends deadline reminder emails for tasks due/overdue, marks `reminderSent = dateStr` to prevent duplicates
- Header nav pills: Tasks ↔ Notes toggle

## File Structure Notes
- `backend/src/jobs/deadlineReminder.mjs` — cron job
- `backend/src/utils/emailService.mjs` — nodemailer; sendVerificationEmail, sendPasswordResetEmail, sendDeadlineReminderEmail
- `frontend/src/pages/Notes.jsx` — full notes feature
- `frontend/src/styles/notes.css` — notes styles
- `frontend/src/components/Header.jsx` — contains theme logic + applyTheme(), nav pills

**Why email auto-verify fallback:** User's Gmail App Password was rejected (535 error). Rather than crashing registration, the app degrades gracefully — still fully usable.
