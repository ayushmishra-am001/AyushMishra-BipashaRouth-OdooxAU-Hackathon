const LABELS = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half day',
  leave: 'On leave',
};

export function AttendanceStatusBadge({ status }) {
  const label = LABELS[status] || status;
  return <span className={`attendance-badge attendance-badge--${status}`}>{label}</span>;
}
