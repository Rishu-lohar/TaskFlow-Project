import React from "react";
import { Row, Col } from "react-bootstrap";

const Dashboard = ({ tasks }) => {
  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.completed
  ).length;

  const pending = total - completed;

  return (
    <div>
      <h5
        className="mb-3"
        style={{
          color: "#00d4ff",
          fontWeight: "600",
        }}
      >
        <i className="bi bi-graph-up me-2"></i>
        Dashboard
      </h5>

      <Row className="g-3">
        <Col md={12} lg={4}>
          <div className="stat-card">
            <div className="stat-value">
              {total}
            </div>

            <div className="stat-label">
              Total Tasks
            </div>
          </div>
        </Col>

        <Col md={12} lg={4}>
          <div className="stat-card">
            <div className="stat-value">
              {completed}
            </div>

            <div className="stat-label">
              Completed
            </div>
          </div>
        </Col>

        <Col md={12} lg={4}>
          <div className="stat-card">
            <div className="stat-value">
              {pending}
            </div>

            <div className="stat-label">
              Pending
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;