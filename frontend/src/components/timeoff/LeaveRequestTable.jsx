import { formatDateShort } from '../../utils/dates';
import { LeaveStatusBadge } from './LeaveStatusBadge';

// `showEmployeeColumn` + `onApprove`/`onReject` turn this into the admin
// approvals list; without them it's just the self "request history" table.
export function LeaveRequestTable({ requests, showEmployeeColumn = false, onApprove, onReject, busyId, emptyMessage }) {
  if (requests.length === 0) {
    return <div className="leave-table__empty">{emptyMessage || 'No requests to show.'}</div>;
  }

  const showActions = Boolean(onApprove || onReject);

  return (
    <table className="leave-table">
      <thead>
        <tr>
          {showEmployeeColumn && <th>Employee</th>}
          <th>Type</th>
          <th>Start</th>
          <th>End</th>
          <th>Remarks</th>
          <th>Status</th>
          {showActions && <th></th>}
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr key={request.id}>
            {showEmployeeColumn && <td>{request.userName}</td>}
            <td>{request.leaveTypeName}</td>
            <td>{formatDateShort(request.startDate)}</td>
            <td>{formatDateShort(request.endDate)}</td>
            <td className="leave-table__remarks">{request.remarks || '—'}</td>
            <td>
              <LeaveStatusBadge status={request.status} />
            </td>
            {showActions && (
              <td className="leave-table__actions">
                {request.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busyId === request.id}
                      onClick={() => onReject?.(request.id)}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={busyId === request.id}
                      onClick={() => onApprove?.(request.id)}
                    >
                      Approve
                    </button>
                  </>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
