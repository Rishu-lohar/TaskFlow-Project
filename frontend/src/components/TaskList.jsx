import React from "react";
import { Card, Button } from "react-bootstrap";

const TaskList = ({
  tasks,
  onDeleteTask,
  onToggleTask,
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return "No deadline";

    const [y, m, d] = dateStr.split("-");

    return new Date(
      y,
      m - 1,
      d
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const todayStr = () => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
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
            <div className="empty-icon">
              📭
            </div>

            <p className="empty-text">
              No tasks yet. Add one above!
            </p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <i className="bi bi-list-check me-2"></i>
          Your Tasks ({tasks.length})
        </Card.Title>
      </Card.Header>

      <Card.Body>
        {tasks.map((task) => {
          const isOverdue =
            task.deadline &&
            !task.completed &&
            task.deadline < todayStr();

          return (
            <div
              key={task.id}
              className={`task-item ${
                task.completed
                  ? "completed"
                  : ""
              } ${
                isOverdue
                  ? "overdue"
                  : ""
              }`}
            >
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={task.completed}
                    onChange={() =>
                      onToggleTask(task.id)
                    }
                  />

                  <span
                    className={`task-name ${
                      task.completed
                        ? "completed"
                        : ""
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="task-meta">
                  <span
                    className={`badge badge-${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>

                  <span>
                    <i className="bi bi-calendar3 me-1"></i>

                    {formatDate(
                      task.deadline
                    )}

                    {isOverdue && (
                      <span className="text-danger ms-1">
                        ⚠️ Overdue
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <Button
                variant="danger"
                size="sm"
                className="ms-2"
                onClick={() =>
                  onDeleteTask(task.id)
                }
              >
                <i className="bi bi-trash"></i>
              </Button>
            </div>
          );
        })}
      </Card.Body>
    </Card>
  );
};

export default TaskList;