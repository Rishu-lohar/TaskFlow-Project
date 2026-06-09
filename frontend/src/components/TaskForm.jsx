import React, { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";

const TaskForm = ({ onAddTask }) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("High");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task!");
      return;
    }

    onAddTask({
      title,
      priority,
      deadline,
    });

    setTitle("");
    setPriority("High");
    setDeadline("");
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Task
        </Card.Title>
      </Card.Header>

      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Task Title</Form.Label>

            <Form.Control
              type="text"
              placeholder="Enter your task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Priority Level</Form.Label>

            <Form.Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="High">🔴 High Priority</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="Low">🟢 Low Priority</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Deadline (Optional)</Form.Label>

            <Form.Control
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100"
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add Task
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default TaskForm;