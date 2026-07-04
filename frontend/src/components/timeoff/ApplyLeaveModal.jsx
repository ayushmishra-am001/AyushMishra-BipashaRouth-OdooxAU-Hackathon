import { useEffect, useState } from 'react';
import { leaveApi } from '../../api/leave';
import { ApiError } from '../../api/client';
import { daysBetweenInclusive } from '../../utils/dates';
import { LeaveCalendarPicker } from './LeaveCalendarPicker';

const initialForm = { leaveTypeId: '', startDate: '', endDate: '', remarks: '', attachmentUrl: '' };

export function ApplyLeaveModal({ leaveTypes, balances, onClose, onSubmitted }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Default to the first leave type once the list has loaded, rather than
  // making the person open the dropdown just to see there's only one choice.
  useEffect(() => {
    if (leaveTypes.length && !form.leaveTypeId) {
      setForm((f) => ({ ...f, leaveTypeId: String(leaveTypes[0].id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveTypes]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const selectedType = leaveTypes.find((t) => String(t.id) === form.leaveTypeId);
  const isSickLeave = selectedType?.name.toLowerCase().includes('sick');
  const balance = balances.find((b) => b.leaveTypeId === Number(form.leaveTypeId));

  const requestedDays =
    form.startDate && form.endDate && form.endDate >= form.startDate
      ? daysBetweenInclusive(form.startDate, form.endDate)
      : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.leaveTypeId || !form.startDate || !form.endDate) {
      setError('Leave type and a date range are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('End date must be on or after the start date.');
      return;
    }
    if (isSickLeave && !form.attachmentUrl.trim()) {
      setError('Sick leave needs a certificate attachment.');
      return;
    }

    setSubmitting(true);
    try {
      await leaveApi.createRequest({
        leaveTypeId: Number(form.leaveTypeId),
        startDate: form.startDate,
        endDate: form.endDate,
        remarks: form.remarks.trim() || undefined,
        attachmentUrl: form.attachmentUrl.trim() || undefined,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <h3 className="modal-card__title">Apply for time off</h3>
        <p className="modal-card__subtitle">Pick a date range and we'll check it against your balance.</p>

        <form className="modal-card__form" onSubmit={handleSubmit} noValidate>
          {error && <div className="banner-error" role="alert">{error}</div>}

          <div className="field">
            <label htmlFor="leave-type">Time off type</label>
            <select id="leave-type" value={form.leaveTypeId} onChange={setField('leaveTypeId')}>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {balance && (
              <p className="field-hint">{balance.remainingDays} of {balance.allocatedDays} days remaining</p>
            )}
          </div>

          <div className="field">
            <label>Date range</label>
            <LeaveCalendarPicker
              startDate={form.startDate}
              endDate={form.endDate}
              onChange={({ startDate, endDate }) => setForm((f) => ({ ...f, startDate, endDate }))}
            />
            {form.startDate && (
              <p className="field-hint">
                {form.startDate === form.endDate
                  ? `Selected: ${form.startDate}`
                  : `Selected: ${form.startDate} → ${form.endDate}`}
              </p>
            )}
          </div>

          {requestedDays !== null && <p className="field-hint">{requestedDays} day(s) requested</p>}

          <div className="field">
            <label htmlFor="leave-remarks">Remarks</label>
            <textarea
              id="leave-remarks"
              rows={3}
              value={form.remarks}
              onChange={setField('remarks')}
              placeholder="Optional note for your approver"
            />
          </div>

          {isSickLeave && (
            <div className="field">
              <label htmlFor="leave-attachment">Sick leave certificate (attachment URL)</label>
              <input
                id="leave-attachment"
                value={form.attachmentUrl}
                onChange={setField('attachmentUrl')}
                placeholder="Link to a scanned certificate"
              />
            </div>
          )}

          <div className="modal-card__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
