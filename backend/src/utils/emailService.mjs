import nodemailer from "nodemailer";

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in backend .env`);
  return value;
};

const getTransporter = () => {
  const user = getRequiredEnv("EMAIL_USER");
  const pass = getRequiredEnv("EMAIL_PASS");

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: { user, pass },
  });
};

const getFromAddress = () => `"TaskFlow" <${getRequiredEnv("EMAIL_USER")}>`;

const baseStyles = `
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  max-width:500px;margin:0 auto;
  background:#161b22;border:1px solid rgba(48,64,88,0.8);
  border-radius:16px;overflow:hidden;
`;

export const sendVerificationEmail = async (email, name, otp) => {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: email,
    subject: "Verify your TaskFlow account",
    html: `
      <div style="${baseStyles}">
        <div style="background:#0d1117;padding:24px 32px;text-align:center;border-bottom:1px solid rgba(48,64,88,0.8);">
          <h1 style="color:#e6edf3;font-size:1.5rem;font-weight:700;margin:0;"><span style="color:#58a6ff;">✓</span> TaskFlow</h1>
        </div>
        <div style="padding:28px 32px;">
          <h2 style="color:#e6edf3;font-size:1.1rem;font-weight:600;margin:0 0 10px;">Hi ${name},</h2>
          <p style="color:#8b949e;font-size:0.9rem;line-height:1.6;margin:0 0 24px;">Enter this code to verify your email address. It expires in <strong style="color:#e6edf3;">10 minutes</strong>.</p>
          <div style="background:#0d1117;border:1px solid rgba(88,166,255,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
            <div style="color:#58a6ff;font-size:2.4rem;font-weight:700;letter-spacing:12px;">${otp}</div>
          </div>
          <p style="color:#6e7681;font-size:0.78rem;margin:0;">If you didn't create a TaskFlow account, ignore this email.</p>
        </div>
      </div>`,
  });
};

export const sendPasswordResetEmail = async (email, name, otp) => {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <div style="${baseStyles}">
        <div style="background:#0d1117;padding:24px 32px;text-align:center;border-bottom:1px solid rgba(48,64,88,0.8);">
          <h1 style="color:#e6edf3;font-size:1.5rem;font-weight:700;margin:0;"><span style="color:#58a6ff;">✓</span> TaskFlow</h1>
        </div>
        <div style="padding:28px 32px;">
          <h2 style="color:#e6edf3;font-size:1.1rem;font-weight:600;margin:0 0 10px;">Password Reset — Hi ${name}</h2>
          <p style="color:#8b949e;font-size:0.9rem;line-height:1.6;margin:0 0 24px;">Use this code to reset your password. Valid for <strong style="color:#e6edf3;">10 minutes</strong>.</p>
          <div style="background:#0d1117;border:1px solid rgba(248,81,73,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
            <div style="color:#f85149;font-size:2.4rem;font-weight:700;letter-spacing:12px;">${otp}</div>
          </div>
          <p style="color:#6e7681;font-size:0.78rem;margin:0;">If you didn't request a password reset, ignore this email. Your password won't change.</p>
        </div>
      </div>`,
  });
};

export const sendDeadlineReminderEmail = async (email, name, tasks) => {
  const taskRows = tasks.map(t => {
    const label = t.isOverdue ? "⚠️ Overdue" : "📅 Due Today";
    const color = t.isOverdue ? "#f85149" : "#58a6ff";
    const priorityColor = t.priority === "High" ? "#f85149" : t.priority === "Medium" ? "#d29922" : "#3fb950";
    return `
      <div style="background:#0d1117;border:1px solid rgba(48,64,88,0.8);border-radius:10px;padding:14px 16px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <strong style="color:#e6edf3;font-size:0.9rem;">${t.title}</strong>
          <span style="color:${color};font-size:0.75rem;font-weight:600;">${label}</span>
        </div>
        <div style="color:#8b949e;font-size:0.78rem;">
          Priority: <span style="color:${priorityColor};font-weight:600;">${t.priority}</span> · Deadline: <span style="color:#e6edf3;">${t.deadlineStr}</span>
        </div>
      </div>`;
  }).join("");

  await getTransporter().sendMail({
    from: getFromAddress(),
    to: email,
    subject: `⏰ ${tasks.length} task${tasks.length > 1 ? "s" : ""} need your attention — TaskFlow`,
    html: `
      <div style="${baseStyles}">
        <div style="background:#0d1117;padding:24px 32px;text-align:center;border-bottom:1px solid rgba(48,64,88,0.8);">
          <h1 style="color:#e6edf3;font-size:1.5rem;font-weight:700;margin:0;"><span style="color:#58a6ff;">✓</span> TaskFlow</h1>
        </div>
        <div style="padding:28px 32px;">
          <h2 style="color:#e6edf3;font-size:1.05rem;font-weight:600;margin:0 0 8px;">Hi ${name} 👋</h2>
          <p style="color:#8b949e;font-size:0.9rem;line-height:1.6;margin:0 0 18px;">
            You have <strong style="color:#e6edf3;">${tasks.length} task${tasks.length > 1 ? "s" : ""}</strong> that need attention today.
          </p>
          ${taskRows}
        </div>
      </div>`,
  });
};
