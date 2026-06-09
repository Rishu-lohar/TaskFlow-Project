import React from 'react';
import { Card, Button } from 'react-bootstrap';

const Calendar = ({ tasks, currentDate, onDateChange }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthYear = new Date(year, month).toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const taskDates = {};
  tasks.forEach(t => {
    if (t.deadline && t.deadline.startsWith(
      `${year}-${String(month + 1).padStart(2, '0')}`
    )) {
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

  const remaining = days.length % 7;
  if (remaining !== 0) {
    for (let i = 0; i < 7 - remaining; i++) days.push(null);
  }

  return (
    <Card>

      {/* ── HEADER ── */}
      <Card.Header>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}>

          {/* Left — Title */}
          <Card.Title className="mb-0" style={{
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}>
            <i className="bi bi-calendar-event"></i>
            Calendar
          </Card.Title>

          {/* Right — Nav Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={prevMonth}
              style={{ padding: '4px 10px' }}
            >
              <i className="bi bi-chevron-left"></i>
            </Button>

            <span style={{
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              minWidth: '130px',
              textAlign: 'center',
              display: 'inline-block'
            }}>
              {monthYear}
            </span>

            <Button
              variant="outline-primary"
              size="sm"
              onClick={nextMonth}
              style={{ padding: '4px 10px' }}
            >
              <i className="bi bi-chevron-right"></i>
            </Button>
          </div>

        </div>
      </Card.Header>

      {/* ── BODY ── */}
      <Card.Body>

        {/* Weekday headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} style={{
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '4px 0'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '5px'
        }}>
          {days.map((day, i) => {

            if (!day) {
              return (
                <div key={`empty-${i}`} style={{
                  height: '34px',
                  background: 'transparent',
                  border: 'none'
                }} />
              );
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr();
            const hasTasks = taskDates[day] ? taskDates[day].length : 0;
            const allDone = hasTasks && taskDates[day].every(t => t.completed);
            const hasOverdue = hasTasks && taskDates[day].some(
              t => !t.completed && dateStr < todayStr()
            );

            const dotColor = allDone
              ? 'var(--green)'
              : hasOverdue
              ? 'var(--red)'
              : 'var(--blue)';

            return (
              <div
                key={`day-${day}`}
                title={hasTasks ? `${hasTasks} task(s)` : ''}
                style={{
                  height: '34px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isToday ? 'var(--blue)' : 'var(--bg-input)',
                  border: isToday
                    ? '1px solid var(--blue)'
                    : '1px solid var(--border)',
                  borderRadius: '6px',
                  color: isToday ? '#0d1117' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  fontWeight: isToday ? 700 : 500,
                  cursor: hasTasks ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (!isToday) {
                    e.currentTarget.style.background = 'var(--blue-dim)';
                    e.currentTarget.style.borderColor = 'var(--blue)';
                    e.currentTarget.style.color = 'var(--blue)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isToday) {
                    e.currentTarget.style.background = 'var(--bg-input)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {day}

                {hasTasks > 0 && (
                  <span style={{
                    position: 'absolute',
                    bottom: '3px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: isToday ? '#0d1117' : dotColor
                  }} />
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