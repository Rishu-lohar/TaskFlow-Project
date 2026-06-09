import React from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';

const Calendar = ({ tasks, currentDate, onDateChange }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthYear = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const taskDates = {};
  tasks.forEach(t => {
    if (t.deadline && t.deadline.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
      const day = parseInt(t.deadline.split('-')[2]);
      taskDates[day] = taskDates[day] || [];
      taskDates[day].push(t);
    }
  });

  const prevMonth = () => onDateChange(new Date(year, month - 1));
  const nextMonth = () => onDateChange(new Date(year, month + 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <Card>
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <Card.Title className="mb-0">
            <i className="bi bi-calendar-event me-2"></i>Calendar
          </Card.Title>
          <div>
            <Button variant="outline-primary" size="sm" onClick={prevMonth} className="me-2">
              <i className="bi bi-chevron-left"></i>
            </Button>
            <span className="text-light">{monthYear}</span>
            <Button variant="outline-primary" size="sm" onClick={nextMonth} className="ms-2">
              <i className="bi bi-chevron-right"></i>
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="weekday">
                {day}
                </div>
            ))}
        </div>
        
        <div className="calendar-grid">
          {days.map((day, i) => {
            if (!day) return <div key={i} className="calendar-day empty"></div>;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr();
            const hasTasks = taskDates[day] ? taskDates[day].length : 0;
            const allDone = hasTasks && taskDates[day].every(t => t.completed);
            const hasOverdue = hasTasks && taskDates[day].some(t => !t.completed && dateStr < todayStr());

            return (
              <div key={i} className={`calendar-day ${isToday ? 'today' : ''}`} title={hasTasks ? `${hasTasks} task(s)` : ''}>
                {day}
                {hasTasks && (
                  <span className={`calendar-dot ${allDone ? 'completed' : hasOverdue ? 'overdue' : ''}`}></span>
                )}
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
};

export default Calendar;