// Matches the wireframe legend exactly:
//   green dot   -> present
//   plane icon  -> on_leave
//   yellow dot  -> absent (hasn't applied time off, just not checked in)
const LABELS = {
  present: 'Present today',
  on_leave: 'On leave',
  absent: 'Absent',
};

export function StatusDot({ status }) {
  const label = LABELS[status] || LABELS.absent;

  if (status === 'on_leave') {
    return (
      <span className={`status-dot status-dot--plane`} title={label} aria-label={label}>
        ✈
      </span>
    );
  }

  return <span className={`status-dot status-dot--${status === 'present' ? 'present' : 'absent'}`} title={label} aria-label={label} />;
}
