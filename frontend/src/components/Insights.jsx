import React from 'react';
import { Card } from 'react-bootstrap';

const Insights = ({ tasks }) => {
  const todayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const overdue = tasks.filter(t => t.deadline && !t.completed && t.deadline < todayStr());
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          <i className="bi bi-graph-up-arrow me-2"></i>Insights
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="insight-item">
          <div className="insight-title">
            <i className="bi bi-exclamation-circle me-2"></i>Overdue Tasks
          </div>
          <div className={`insight-value ${overdue.length === 0 ? 'insight-good' : 'insight-danger'}`}>
            {overdue.length === 0 ? '✅ No overdue' : `⚠️ ${overdue.length} overdue`}
          </div>
        </div>

        <div className="insight-item">
          <div className="insight-title">
            <i className="bi bi-percent me-2"></i>Completion Rate
          </div>
          <div className={`insight-value ${rate >= 70 ? 'insight-good' : rate >= 40 ? 'insight-warning' : 'insight-danger'}`}>
            {rate}%
          </div>
          <div className="progress mt-2">
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${rate}%`,
                background: rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444'
              }}
              aria-valuenow={rate}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Insights;