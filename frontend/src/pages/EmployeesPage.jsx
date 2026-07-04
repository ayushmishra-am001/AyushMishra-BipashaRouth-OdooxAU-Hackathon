import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeesApi } from '../api/employees';
import { ApiError } from '../api/client';
import { EmployeeCard } from '../components/employees/EmployeeCard';
import { AddEmployeeModal } from '../components/employees/AddEmployeeModal';

export default function EmployeesPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'hr';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const loadEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await employeesApi.list();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the employee directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.employeeCode?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <div className="employees-page">
      <div className="page-header">
        <div>
          <h2>Employees</h2>
          <p className="page-header__subtitle">{employees.length} people at your company</p>
        </div>
        <div className="page-header__actions">
          <input
            className="search-input"
            type="search"
            placeholder="Search by name, code, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isPrivileged && (
            <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              + New
            </button>
          )}
        </div>
      </div>

      {error && <div className="banner-error" role="alert">{error}</div>}

      {loading ? (
        <div className="loading-note">Loading employees…</div>
      ) : filtered.length === 0 ? (
        <div className="page-placeholder">
          <h2>No employees found</h2>
          <p>{search ? 'Try a different search.' : 'No one has been added yet.'}</p>
        </div>
      ) : (
        <div className="employee-grid">
          {filtered.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} onCreated={loadEmployees} />
      )}
    </div>
  );
}
