import React from "react";
import { Card } from "react-bootstrap";
import "../styles/tasklist.css";

const toDateStr = (d) => d ? d.split('T')[0] : null;

const TaskList = ({ tasks, onDeleteTask, onToggleTask }) => {

  const formatDate = (dateVal) => {
    const dateStr = toDateStr(dateVal);
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const todayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>
            <i className="bi bi-list-check me-2"></i>
            Your Tasks
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p className="empty-text">No tasks yet. Add one above!</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <Card>
      <Card.Header>
        <div className="task-header">
          <Card.Title className="mb-0">
            <i className="bi bi-list-check me-2"></i>
            Your Tasks ({tasks.length})
          </Card.Title>
          <div className="task-summary">
            <span className="summary-badge done-badge">
              ✓ {tasks.filter((t) => t.completed).length} done
            </span>
            <span className="summary-badge pending-badge">
              {tasks.filter((t) => !t.completed).length} pending
            </span>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {sortedTasks.map((task) => {
          const deadlineStr = toDateStr(task.deadline);
          const isOverdue = deadlineStr && !task.completed && deadlineStr < todayStr();
          const formattedDate = formatDate(task.deadline);

          return (
            <div
              key={task._id}
              className={`task-item ${task.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}`}
            >
              <div className="task-left">
                <div className="task-title-row">
                  <span className={`task-name ${task.completed ? "completed" : ""}`}>
                    {task.title}
                  </span>
                </div>

                <div className="task-meta">
                  <span className={`badge badge-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>

                  {formattedDate && (
                    <span>
                      <i className="bi bi-calendar3 me-1"></i>
                      {formattedDate}
                      {isOverdue && (
                        <span className="overdue-text"> ⚠ Overdue</span>
                      )}
                    </span>
                  )}

                  {task.completed && (
                    <span className="completed-text">✓ Completed</span>
                  )}
                </div>
              </div>

              <div className="task-actions">
                <button
                  onClick={() => onToggleTask(task._id)}
                  title={task.completed ? "Mark as pending" : "Mark as complete"}
                  className={`icon-btn complete-btn ${task.completed ? "completed" : ""}`}
                >
                  <i className={`bi ${task.completed ? "bi-arrow-counterclockwise" : "bi-check-lg"}`} />
                </button>

                <button
                  onClick={() => onDeleteTask(task._id)}
                  title="Delete Task"
                  className="icon-btn delete-btn"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          );
        })}
      </Card.Body>
    </Card>
  );
};

export default TaskList;
