import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  const [loading, setLoading] = useState(true);

  const getAuthHeader = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    return { headers: { Authorization: `Bearer ${userInfo.token}` } };
  };

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (!userInfo.token) {
      navigate("/login");
      return;
    }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get("/api/tasks", getAuthHeader());
      setTasks(data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("userInfo");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData) => {
    try {
      const { data } = await axios.post("/api/tasks", taskData, getAuthHeader());
      setTasks((prev) => [data, ...prev]);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add task");
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`/api/tasks/${id}`, getAuthHeader());
      setTasks((prev) => prev.filter((task) => task._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete task");
    }
  };

  const toggleTask = async (id) => {
    try {
      const { data } = await axios.put(`/api/tasks/${id}`, {}, getAuthHeader());
      setTasks((prev) => prev.map((task) => (task._id === id ? data : task)));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update task");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          <i className="bi bi-arrow-clockwise me-2" />
          Loading tasks...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      <Header onTasksCleared={() => setTasks([])} />
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
