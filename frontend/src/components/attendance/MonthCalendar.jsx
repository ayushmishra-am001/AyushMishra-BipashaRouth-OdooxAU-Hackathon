import { toDateString, todayString } from '../../utils/dates';

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half day',
  leave: 'On leave',
};

function buildMonthGrid(year, month) {
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
 * Renders one month with each day colored by attendance status, so the
 * whole month's Present/Absent/On-leave pattern is visible at a glance -
 * the calendar view called for alongside the day/week table (see wireframe
 * "For Employees View" panel and PRD 3.5.1).
 */
export function MonthCalendar({ year, month, recordsByDate }) {
  const today = todayString();
  const cells = buildMonthGrid(year, month);

  return (
    <div className="month-calendar">
      <div className="month-calendar__grid month-calendar__grid--headers">
        {WEEKDAY_HEADERS.map((label) => (
          <span key={label} className="month-calendar__weekday">{label}</span>
        ))}
      </div>

      <div className="month-calendar__grid">
        {cells.map((date, i) => {
          if (!date) return <span key={i} className="month-calendar__day month-calendar__day--empty" />;

          const dateStr = toDateString(date);
          const record = recordsByDate.get(dateStr);
          const isFuture = dateStr > today;
          const isToday = dateStr === today;
          const status = !isFuture && record ? record.status : null;

          const classNames = ['month-calendar__day'];
          if (status) classNames.push(`month-calendar__day--${status}`);
          if (isFuture) classNames.push('month-calendar__day--future');
          if (isToday) classNames.push('month-calendar__day--today');

          const label = status ? STATUS_LABELS[status] : isFuture ? 'Upcoming' : 'No record';

          return (
            <span key={i} className={classNames.join(' ')} title={`${dateStr} · ${label}`}>
              {date.getDate()}
            </span>
          );
        })}
      </div>

      <div className="month-calendar__legend">
        <span className="month-calendar__legend-item"><i className="month-calendar__swatch month-calendar__swatch--present" />Present</span>
        <span className="month-calendar__legend-item"><i className="month-calendar__swatch month-calendar__swatch--half_day" />Half day</span>
        <span className="month-calendar__legend-item"><i className="month-calendar__swatch month-calendar__swatch--leave" />On leave</span>
        <span className="month-calendar__legend-item"><i className="month-calendar__swatch month-calendar__swatch--absent" />Absent</span>
      </div>
    </div>
  );
}
