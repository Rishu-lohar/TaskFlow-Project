import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your TaskFlow account",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#161b22;border:1px solid rgba(48,64,88,0.8);border-radius:16px;overflow:hidden;">
        <div style="background:#0d1117;padding:28px 32px 20px;text-align:center;border-bottom:1px solid rgba(48,64,88,0.8);">
          <h1 style="color:#e6edf3;font-size:1.6rem;font-weight:700;margin:0;">
            <span style="color:#58a6ff;">✓</span> TaskFlow
          </h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#e6edf3;font-size:1.15rem;font-weight:600;margin:0 0 10px;">Hi ${name},</h2>
          <p style="color:#8b949e;font-size:0.92rem;line-height:1.6;margin:0 0 24px;">
            Thanks for signing up! Use the code below to verify your email address. It expires in <strong style="color:#e6edf3;">10 minutes</strong>.
          </p>
          <div style="background:#0d1117;border:1px solid rgba(88,166,255,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <div style="color:#58a6ff;font-size:2.5rem;font-weight:700;letter-spacing:10px;">${otp}</div>
          </div>
          <p style="color:#6e7681;font-size:0.78rem;margin:0;">If you didn't create a TaskFlow account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendDeadlineReminderEmail = async (email, name, tasks) => {
  const taskRows = tasks.map(t => {
    const label = t.isOverdue ? "⚠️ Overdue" : "📅 Due Today";
    const color = t.isOverdue ? "#f85149" : "#58a6ff";
    const priorityColor = t.priority === "High" ? "#f85149" : t.priority === "Medium" ? "#d29922" : "#3fb950";
    return `
      <div style="background:#0d1117;border:1px solid rgba(48,64,88,0.8);border-radius:10px;padding:16px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="color:#e6edf3;font-size:0.92rem;">${t.title}</strong>
          <span style="color:${color};font-size:0.78rem;font-weight:600;">${label}</span>
        </div>
        <div style="color:#8b949e;font-size:0.78rem;">
          Priority: <span style="color:${priorityColor};font-weight:600;">${t.priority}</span>
          &nbsp;·&nbsp; Deadline: <span style="color:#e6edf3;">${t.deadlineStr}</span>
        </div>
      </div>
    `;
  }).join("");

  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `⏰ You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} needing attention — TaskFlow`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#161b22;border:1px solid rgba(48,64,88,0.8);border-radius:16px;overflow:hidden;">
        <div style="background:#0d1117;padding:24px 32px;text-align:center;border-bottom:1px solid rgba(48,64,88,0.8);">
          <h1 style="color:#e6edf3;font-size:1.5rem;font-weight:700;margin:0;">
            <span style="color:#58a6ff;">✓</span> TaskFlow
          </h1>
        </div>
        <div style="padding:28px 32px;">
          <h2 style="color:#e6edf3;font-size:1.1rem;font-weight:600;margin:0 0 8px;">Hi ${name} 👋</h2>
          <p style="color:#8b949e;font-size:0.9rem;line-height:1.6;margin:0 0 20px;">
            You have <strong style="color:#e6edf3;">${tasks.length} task${tasks.length > 1 ? "s" : ""}</strong> that ${tasks.length > 1 ? "are" : "is"} due today or overdue. Don't let them slip!
          </p>
          ${taskRows}
          <div style="margin-top:24px;text-align:center;">
            <a href="${process.env.APP_URL || "https://taskflow.replit.app"}/dashboard"
               style="background:#58a6ff;color:#0d1117;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;font-size:0.9rem;display:inline-block;">
              Open TaskFlow →
            </a>
          </div>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(48,64,88,0.8);text-align:center;">
          <p style="color:#6e7681;font-size:0.75rem;margin:0;">You're receiving this because you have an active TaskFlow account.</p>
        </div>
      </div>
    `,
  });
};
