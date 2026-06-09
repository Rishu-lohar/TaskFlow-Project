import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";

import "./App.css";

import Header from "./components/Header";
import TaskForm from "./components/TaskForm";
import Dashboard from "./components/Dashboard";
import TaskList from "./components/TaskList";
import Calendar from "./components/Calendar";
import Insights from "./components/Insights";

function App() {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load tasks from localStorage on first render
  useEffect(() => {
    const savedTasks = localStorage.getItem("taskflow-tasks");

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks whenever tasks change
  useEffect(() => {
    localStorage.setItem(
      "taskflow-tasks",
      JSON.stringify(tasks)
    );
  }, [tasks]);

  // Add New Task
  const addTask = (taskData) => {
    const newTask = {
      id: Date.now(),
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((prevTasks) => [newTask, ...prevTasks]);

    showToast("Task added successfully!", "success");
  };

  // Delete Task
  const deleteTask = (id) => {
    setTasks((prevTasks) =>
      prevTasks.filter((task) => task.id !== id)
    );

    showToast("Task deleted!", "info");
  };

  // Mark Complete / Incomplete
  const toggleTask = (id) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  };

  // Bootstrap Toast Notification
  const showToast = (message, type) => {
    const icon =
      type === "success"
        ? "check-circle"
        : type === "error"
        ? "exclamation-circle"
        : "info-circle";

    const toastHtml = `
      <div class="toast ${type} show" role="alert">
        <div class="toast-body d-flex align-items-center">
          <i class="bi bi-${icon} me-2"></i>
          ${message}
        </div>
      </div>
    `;

    let toastContainer =
      document.querySelector(".toast-container");

    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = toastHtml;

    toastContainer.appendChild(
      tempDiv.firstElementChild
    );

    setTimeout(() => {
      const firstToast =
        toastContainer.querySelector(".toast");

      if (firstToast) {
        firstToast.remove();
      }
    }, 3000);
  };

  return (
    <div className="app">
      <Header />

      <Container fluid>
        <div className="main-layout">
          <div className="left-panel">
            <TaskForm onAddTask={addTask} />

            <Dashboard tasks={tasks} />

            <TaskList
              tasks={tasks}
              onDeleteTask={deleteTask}
              onToggleTask={toggleTask}
            />
          </div>

          <div className="right-panel">
            <Calendar
              tasks={tasks}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />

            <Insights tasks={tasks} />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default App;