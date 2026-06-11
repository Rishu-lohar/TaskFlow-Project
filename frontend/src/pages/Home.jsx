import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import TaskForm from "../components/TaskForm";
import Dashboard from "../components/Dashboard";
import TaskList from "../components/TaskList";
import Calendar from "../components/Calendar";
import Insights from "../components/Insights";

function Home() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Redirect to login if not logged in
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      navigate("/login");
    }
  }, [navigate]);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("taskflow-tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (taskData) => {
    const newTask = {
      id: Date.now(),
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  return (
    <div className="app">
      <Header />
       <div style={{ padding: '28px 24px' }}>

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
    </div>
  );
}

export default Home;