const LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function LeaveStatusBadge({ status }) {
  return <span className={`leave-badge leave-badge--${status}`}>{LABELS[status] || status}</span>;
}
