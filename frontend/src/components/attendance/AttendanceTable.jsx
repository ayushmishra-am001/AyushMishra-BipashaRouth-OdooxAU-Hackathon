import { formatDateLong } from '../../utils/dates';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

function hours(value) {
  return value === null || value === undefined ? '—' : `${value}h`;
}

function time(value) {
  return value || '—';
}

// `rows` come from either GET /attendance (self/date range - has `date`) or
// GET /attendance/company (admin, one day - has `name`). Passing
// `showEmployeeColumn` swaps the first column between the two shapes instead
// of needing two near-identical table components.
export function AttendanceTable({ rows, showEmployeeColumn = false, emptyMessage }) {
  if (rows.length === 0) {
    return <div className="attendance-table__empty">{emptyMessage || 'No records for this period.'}</div>;
  }

  return (
    <table className="attendance-table">
      <thead>
        <tr>
          <th>{showEmployeeColumn ? 'Employee' : 'Date'}</th>
          <th>Check In</th>
          <th>Check Out</th>
          <th>Work Hours</th>
          <th>Extra Hours</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={showEmployeeColumn ? row.userId : row.date}>
            <td>{showEmployeeColumn ? row.name : formatDateLong(row.date)}</td>
            <td>{time(row.checkIn)}</td>
            <td>{time(row.checkOut)}</td>
            <td>{hours(row.workHours)}</td>
            <td>{hours(row.extraHours)}</td>
            <td>
              <AttendanceStatusBadge status={row.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
