import { Link } from 'react-router-dom';
import { StatusDot } from './StatusDot';

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function EmployeeCard({ employee }) {
  return (
    <Link to={`/employees/${employee.id}`} className="employee-card">
      <div className="employee-card__avatar-wrap">
        {employee.avatarUrl ? (
          <img src={employee.avatarUrl} alt="" className="employee-card__avatar-img" />
        ) : (
          <span className="employee-card__avatar-fallback">{initials(employee.name)}</span>
        )}
        <StatusDot status={employee.status} />
      </div>
      <div className="employee-card__name">{employee.name}</div>
      <div className="employee-card__meta">{employee.designation || '—'}</div>
      <div className="employee-card__code">{employee.employeeCode}</div>
    </Link>
  );
}
