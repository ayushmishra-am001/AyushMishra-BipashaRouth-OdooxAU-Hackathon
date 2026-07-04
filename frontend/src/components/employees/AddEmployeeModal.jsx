import { useState } from 'react';
import { employeesApi } from '../../api/employees';
import { ApiError } from '../../api/client';
import { isValidEmail } from '../../utils/validation';

const initialForm = { name: '', email: '', role: 'employee', designation: '', department: '', dateOfJoining: '' };

export function AddEmployeeModal({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null); // { user, tempPassword } once saved

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.dateOfJoining) {
      setError('Name and date of joining are required.');
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await employeesApi.createEmployee(form);
      setCreated(result);
      onCreated?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the employee. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        {created ? (
          <>
            <h3 className="modal-card__title">Employee added</h3>
            <p className="modal-card__subtitle">
              Share these sign-in details with {created.user.name} - they'll be asked to set their own password on first login.
            </p>
            <dl className="credential-list">
              <dt>Employee code</dt>
              <dd>{created.user.employeeCode}</dd>
              <dt>Email</dt>
              <dd>{created.user.email}</dd>
              <dt>Temporary password</dt>
              <dd className="credential-list__password">{created.tempPassword}</dd>
            </dl>
            <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <h3 className="modal-card__title">Add employee</h3>
            <p className="modal-card__subtitle">Creates their login and generates an employee code + temporary password.</p>

            <form className="modal-card__form" onSubmit={handleSubmit} noValidate>
              {error && <div className="banner-error" role="alert">{error}</div>}

              <div className="field">
                <label htmlFor="new-name">Full name</label>
                <input id="new-name" value={form.name} onChange={setField('name')} />
              </div>

              <div className="field">
                <label htmlFor="new-email">Email</label>
                <input id="new-email" type="email" value={form.email} onChange={setField('email')} />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="new-role">Role</label>
                  <select id="new-role" value={form.role} onChange={setField('role')}>
                    <option value="employee">Employee</option>
                    <option value="hr">HR Officer</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="new-joining">Date of joining</label>
                  <input id="new-joining" type="date" value={form.dateOfJoining} onChange={setField('dateOfJoining')} />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="new-designation">Designation</label>
                  <input id="new-designation" value={form.designation} onChange={setField('designation')} />
                </div>
                <div className="field">
                  <label htmlFor="new-department">Department</label>
                  <input id="new-department" value={form.department} onChange={setField('department')} />
                </div>
              </div>

              <div className="modal-card__actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding…' : 'Add employee'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
