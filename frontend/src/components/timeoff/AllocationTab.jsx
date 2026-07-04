import { useState } from 'react';
import { leaveApi } from '../../api/leave';
import { ApiError } from '../../api/client';

/**
 * Admin/HR "Allocation" tab (wireframe: Time Off | Allocation tabs, top-left
 * of image 3). Lets them change how many days each leave type grants
 * company-wide. Separate from the Time Off tab, which is about reviewing
 * individual requests - this is about the underlying policy those requests
 * draw down against.
 */
export function AllocationTab({ leaveTypes, onSaved }) {
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(leaveTypes.map((t) => [t.id, String(t.allocatedDays)]))
  );
  const [applyNow, setApplyNow] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState(null);

  const setDraft = (id, value) => setDrafts((d) => ({ ...d, [id]: value }));
  const toggleApplyNow = (id) => setApplyNow((a) => ({ ...a, [id]: !a[id] }));

  const handleSave = async (leaveType) => {
    setError('');
    setSavedId(null);
    const value = Number(drafts[leaveType.id]);
    if (!Number.isFinite(value) || value < 0) {
      setError(`Enter a valid number of days for ${leaveType.name}.`);
      return;
    }

    setSavingId(leaveType.id);
    try {
      await leaveApi.updateAllocation(leaveType.id, {
        allocatedDays: value,
        applyToCurrentYear: Boolean(applyNow[leaveType.id]),
      });
      setSavedId(leaveType.id);
      onSaved?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not update ${leaveType.name}.`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="allocation-tab">
      <p className="allocation-tab__intro">
        Set how many days each leave type grants per year. New employees get these defaults
        automatically; existing employees keep their current balance unless you check
        &ldquo;Apply to this year too&rdquo;.
      </p>

      {error && <div className="banner-error" role="alert">{error}</div>}

      <div className="allocation-rows">
        {leaveTypes.map((type) => (
          <div className="allocation-row" key={type.id}>
            <span className="allocation-row__name">{type.name}</span>
            <input
              type="number"
              min="0"
              className="allocation-row__input"
              value={drafts[type.id]}
              onChange={(e) => setDraft(type.id, e.target.value)}
            />
            <span className="allocation-row__unit">days / year</span>

            <label className="allocation-row__checkbox">
              <input
                type="checkbox"
                checked={Boolean(applyNow[type.id])}
                onChange={() => toggleApplyNow(type.id)}
              />
              Apply to this year too
            </label>

            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => handleSave(type)}
              disabled={savingId === type.id}
            >
              {savingId === type.id ? 'Saving…' : 'Save'}
            </button>

            {savedId === type.id && <span className="allocation-row__saved">Saved</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
