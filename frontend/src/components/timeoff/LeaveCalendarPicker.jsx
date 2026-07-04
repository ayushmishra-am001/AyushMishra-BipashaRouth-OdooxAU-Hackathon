import { useState } from 'react';
import { toDateString, todayString } from '../../utils/dates';

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildMonthGrid(year, month) {
  // month is 0-indexed. Returns a flat array of Date|null, padded to full weeks.
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * A minimal, dependency-free calendar for picking a start/end leave date
 * range by clicking days directly, instead of two plain <input type="date">
 * fields. First click sets the start date; the next click on or after it
 * sets the end date and highlights everything in between; clicking before
 * the current start restarts the range.
 */
export function LeaveCalendarPicker({ startDate, endDate, onChange }) {
  const today = todayString();
  const initial = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const cells = buildMonthGrid(viewYear, viewMonth);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (date) => {
    const clicked = toDateString(date);
    if (clicked < today) return;

    if (!startDate || (startDate && endDate)) {
      // Starting a fresh selection.
      onChange({ startDate: clicked, endDate: clicked });
      return;
    }

    if (clicked < startDate) {
      onChange({ startDate: clicked, endDate: clicked });
    } else {
      onChange({ startDate, endDate: clicked });
    }
  };

  return (
    <div className="leave-calendar">
      <div className="leave-calendar__header">
        <button type="button" className="leave-calendar__nav" onClick={goPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <span className="leave-calendar__title">
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button type="button" className="leave-calendar__nav" onClick={goNextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="leave-calendar__grid leave-calendar__grid--headers">
        {WEEKDAY_HEADERS.map((label, i) => (
          <span key={i} className="leave-calendar__weekday">{label}</span>
        ))}
      </div>

      <div className="leave-calendar__grid">
        {cells.map((date, i) => {
          if (!date) return <span key={i} className="leave-calendar__day leave-calendar__day--empty" />;

          const dateStr = toDateString(date);
          const isPast = dateStr < today;
          const isToday = dateStr === today;
          const isStart = dateStr === startDate;
          const isEnd = dateStr === endDate;
          const inRange = startDate && endDate && dateStr > startDate && dateStr < endDate;

          const classNames = ['leave-calendar__day'];
          if (isPast) classNames.push('leave-calendar__day--disabled');
          if (isToday) classNames.push('leave-calendar__day--today');
          if (isStart || isEnd) classNames.push('leave-calendar__day--selected');
          if (inRange) classNames.push('leave-calendar__day--in-range');

          return (
            <button
              key={i}
              type="button"
              className={classNames.join(' ')}
              disabled={isPast}
              onClick={() => handleDayClick(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
