import { useState, useRef, useEffect } from "react";
import { Card, Form, Button } from "react-bootstrap";

// ─── Custom Date Picker ───────────────────────────────────────────
const CustomDatePicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(
    value ? new Date(value) : new Date()
  );
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const year = pickerDate.getFullYear();
  const month = pickerDate.getMonth();

  const monthYear = new Date(year, month).toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const remaining = days.length % 7;
  if (remaining !== 0) {
    for (let i = 0; i < 7 - remaining; i++) days.push(null);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDayClick = (day) => {
    if (!day) return;
    const selected = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(selected);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('default', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '';

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Trigger Input ── */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: 'var(--bg-input)',
          border: `1px solid ${open ? 'var(--blue)' : 'var(--border-input)'}`,
          borderRadius: '10px',
          padding: '10px 14px',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          boxShadow: open ? '0 0 0 3px rgba(88,166,255,0.1)' : 'none'
        }}
      >
        <span>{displayValue || 'Pick a date (optional)'}</span>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--bg-tag)',
                cursor: 'pointer',
                border: '1px solid var(--border)'
              }}
            >
              clear
            </span>
          )}
          <i
            className="bi bi-calendar3"
            style={{
              color: open ? 'var(--blue)' : 'var(--text-muted)',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      {/* ── Dropdown Calendar ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          zIndex: 9999,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '16px',
          width: '300px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>

          {/* Month Nav */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}>
            <button
              type="button"
              onClick={() => setPickerDate(new Date(year, month - 1))}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem'
              }}
            >
              <i className="bi bi-chevron-left" />
            </button>

            <span style={{
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 600
            }}>
              {monthYear}
            </span>

            <button
              type="button"
              onClick={() => setPickerDate(new Date(year, month + 1))}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem'
              }}
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            marginBottom: '8px'
          }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '4px 0'
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {days.map((day, i) => {
              if (!day) return (
                <div key={`e-${i}`} style={{ height: '34px' }} />
              );

              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === value;
              const isPast = dateStr < todayStr;

              return (
                <div
                  key={`d-${day}`}
                  onClick={() => !isPast && handleDayClick(day)}
                  style={{
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: isSelected || isToday ? 700 : 400,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    background: isSelected
                      ? 'var(--blue)'
                      : isToday
                      ? 'var(--blue-dim)'
                      : 'transparent',
                    color: isSelected
                      ? '#0d1117'
                      : isToday
                      ? 'var(--blue)'
                      : isPast
                      ? 'var(--text-muted)'
                      : 'var(--text-secondary)',
                    border: isToday && !isSelected
                      ? '1px solid var(--blue)'
                      : '1px solid transparent',
                    opacity: isPast ? 0.4 : 1,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected && !isPast) {
                      e.currentTarget.style.background = 'var(--blue-dim)';
                      e.currentTarget.style.color = 'var(--blue)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = isToday
                        ? 'var(--blue-dim)' : 'transparent';
                      e.currentTarget.style.color = isToday
                        ? 'var(--blue)' : isPast
                        ? 'var(--text-muted)' : 'var(--text-secondary)';
                    }
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid var(--border)',
            marginTop: '12px',
            paddingTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setOpen(false);
              }}
              style={{
                background: 'var(--blue-dim)',
                border: '1px solid rgba(88,166,255,0.3)',
                color: 'var(--blue)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '5px 14px',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(88,166,255,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--blue-dim)';
              }}
            >
              Today
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

// ─── Task Form ────────────────────────────────────────────────────
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

    onAddTask({ title, priority, deadline });

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

          {/* Task Title */}
          <Form.Group className="mb-3">
            <Form.Label>Task Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Form.Group>

          {/* Priority */}
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

          {/* Deadline — Custom Date Picker */}
          <Form.Group className="mb-3">
            <Form.Label>Deadline (Optional)</Form.Label>
            <CustomDatePicker
              value={deadline}
              onChange={(val) => setDeadline(val)}
            />
          </Form.Group>

          {/* Submit */}
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
