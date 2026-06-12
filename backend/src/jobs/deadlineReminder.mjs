import cron from "node-cron";
import Task from "../models/Task.mjs";
import User from "../models/User.mjs";
import { sendDeadlineReminderEmail } from "../utils/emailService.mjs";

const toDateStr = (d) => {
  if (!d) return null;
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getTodayStr = () => {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const runDeadlineReminder = async () => {
  try {
    const today = getTodayStr();
    console.log(`[DeadlineReminder] Running for ${today}`);

    const tasks = await Task.find({
      completed: false,
      deadline: { $lte: new Date(today + "T23:59:59.999Z") },
      reminderSent: { $ne: today },
    }).populate("user", "name email isVerified");

    if (tasks.length === 0) {
      console.log("[DeadlineReminder] No pending reminders.");
      return;
    }

    const byUser = {};
    for (const task of tasks) {
      if (!task.user || !task.user.isVerified) continue;
      const uid = task.user._id.toString();
      if (!byUser[uid]) byUser[uid] = { user: task.user, tasks: [] };
      const ds = toDateStr(task.deadline);
      byUser[uid].tasks.push({
        title: task.title,
        priority: task.priority,
        deadlineStr: ds,
        isOverdue: ds < today,
        _id: task._id,
      });
    }

    for (const uid of Object.keys(byUser)) {
      const { user, tasks: userTasks } = byUser[uid];
      try {
        await sendDeadlineReminderEmail(user.email, user.name, userTasks);
        await Task.updateMany(
          { _id: { $in: userTasks.map((t) => t._id) } },
          { $set: { reminderSent: today } }
        );
        console.log(`[DeadlineReminder] Sent reminder to ${user.email} for ${userTasks.length} task(s)`);
      } catch (err) {
        console.error(`[DeadlineReminder] Failed for ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[DeadlineReminder] Error:", err.message);
  }
};

export const startDeadlineReminder = () => {
  cron.schedule("0 8 * * *", runDeadlineReminder, { timezone: "UTC" });
  console.log("[DeadlineReminder] Cron scheduled — runs daily at 08:00 UTC");
};

export { runDeadlineReminder };
