import { useEffect, useState } from 'react';
import { employeesApi } from '../../api/employees';
import { ApiError } from '../../api/client';

const emptyComponent = () => ({ name: '', calcType: 'fixed', value: '' });

function computeAmount(wageAmount, component) {
  const value = Number(component.value) || 0;
  if (component.calcType === 'percentage') return (Number(wageAmount) || 0) * (value / 100);
  return value;
}

export function SalaryTab({ userId }) {
  const [salary, setSalary] = useState(null);
  const [notSetUp, setNotSetUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null); // { wageType, wageAmount, workingDaysPerWeek, components }

  const load = async () => {
    setLoading(true);
    setLoadError('');
    setNotSetUp(false);
    try {
      const data = await employeesApi.getSalary(userId);
      setSalary(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotSetUp(true);
        setSalary(null);
      } else {
        setLoadError(err instanceof ApiError ? err.message : 'Could not load salary details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const startEditing = () => {
    setSaveError('');
    setDraft(
      salary
        ? {
            wageType: salary.wageType,
            wageAmount: salary.wageAmount,
            workingDaysPerWeek: salary.workingDaysPerWeek,
            components: salary.components.map((c) => ({ name: c.name, calcType: c.calcType, value: c.value })),
          }
        : { wageType: 'monthly', wageAmount: '', workingDaysPerWeek: 5, components: [] }
    );
    setEditing(true);
  };

  const updateDraftField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const updateComponent = (index, key, value) =>
    setDraft((d) => ({
      ...d,
      components: d.components.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    }));

  const addComponent = () => setDraft((d) => ({ ...d, components: [...d.components, emptyComponent()] }));
  const removeComponent = (index) =>
    setDraft((d) => ({ ...d, components: d.components.filter((_, i) => i !== index) }));

  const total = draft ? draft.components.reduce((sum, c) => sum + computeAmount(draft.wageAmount, c), 0) : 0;
  const overBudget = draft && total > Number(draft.wageAmount || 0) + 0.01;

  const handleSave = async (event) => {
    event.preventDefault();
    setSaveError('');

    const wageAmount = Number(draft.wageAmount);
    if (!Number.isFinite(wageAmount) || wageAmount <= 0) {
      setSaveError('Enter a valid wage amount.');
      return;
    }
    if (draft.components.some((c) => !c.name.trim())) {
      setSaveError('Every component needs a name.');
      return;
    }
    if (overBudget) {
      setSaveError('Component total cannot exceed the wage amount.');
      return;
    }

    setSaving(true);
    try {
      const saved = await employeesApi.updateSalary(userId, {
        wageType: draft.wageType,
        wageAmount,
        workingDaysPerWeek: Number(draft.workingDaysPerWeek) || 5,
        components: draft.components.map((c) => ({ ...c, value: Number(c.value) || 0 })),
      });
      setSalary(saved);
      setNotSetUp(false);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save the salary structure.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-note">Loading salary details…</div>;
  if (loadError) return <div className="banner-error" role="alert">{loadError}</div>;

  if (!editing) {
    if (notSetUp) {
      return (
        <div className="profile-tab-panel">
          <p>No salary structure has been set up for this employee yet.</p>
          <button type="button" className="btn btn-primary" onClick={startEditing}>
            Set up salary
          </button>
        </div>
      );
    }

    return (
      <div className="profile-tab-panel">
        <div className="salary-summary">
          <div className="salary-summary__wage">
            <span className="profile-field__label">{salary.wageType === 'monthly' ? 'Monthly wage' : 'Yearly wage'}</span>
            <span className="salary-summary__amount">₹{Number(salary.wageAmount).toLocaleString('en-IN')}</span>
          </div>
          <div className="profile-field-grid">
            <ProfileStat label="Working days / week" value={salary.workingDaysPerWeek} />
            <ProfileStat label="PF rate" value={`${salary.pfRate}%`} />
            <ProfileStat label="Employee PF" value={`₹${salary.employeePfAmount.toLocaleString('en-IN')} / month`} />
            <ProfileStat label="Employer PF" value={`₹${salary.employerPfAmount.toLocaleString('en-IN')} / month`} />
            <ProfileStat label="Professional tax" value={`₹${salary.professionalTax} / month`} />
          </div>
        </div>

        <table className="salary-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Type</th>
              <th>Value</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {salary.components.length === 0 ? (
              <tr>
                <td colSpan={4} className="salary-table__empty">No components added yet.</td>
              </tr>
            ) : (
              salary.components.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.calcType === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                  <td>{c.calcType === 'percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                  <td>₹{Number(c.computedAmount).toLocaleString('en-IN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <button type="button" className="btn btn-ghost" onClick={startEditing}>
          Edit salary
        </button>
      </div>
    );
  }

  return (
    <form className="profile-tab-panel" onSubmit={handleSave}>
      {saveError && <div className="banner-error" role="alert">{saveError}</div>}

      <div className="profile-field-grid">
        <div className="profile-field">
          <span className="profile-field__label">Wage type</span>
          <select value={draft.wageType} onChange={(e) => updateDraftField('wageType', e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="profile-field">
          <span className="profile-field__label">Wage amount (₹)</span>
          <input
            type="number"
            min="0"
            value={draft.wageAmount}
            onChange={(e) => updateDraftField('wageAmount', e.target.value)}
          />
        </div>
        <div className="profile-field">
          <span className="profile-field__label">Working days / week</span>
          <input
            type="number"
            min="1"
            max="7"
            value={draft.workingDaysPerWeek}
            onChange={(e) => updateDraftField('workingDaysPerWeek', e.target.value)}
          />
        </div>
      </div>

      <h4 className="profile-section__title">Salary components</h4>
      <div className="component-rows">
        {draft.components.map((c, i) => (
          <div className="component-row" key={i}>
            <input
              className="component-row__name"
              placeholder="e.g. Basic, HRA"
              value={c.name}
              onChange={(e) => updateComponent(i, 'name', e.target.value)}
            />
            <select value={c.calcType} onChange={(e) => updateComponent(i, 'calcType', e.target.value)}>
              <option value="fixed">Fixed</option>
              <option value="percentage">% of wage</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={c.value}
              onChange={(e) => updateComponent(i, 'value', e.target.value)}
            />
            <span className="component-row__computed">
              ₹{computeAmount(draft.wageAmount, c).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <button type="button" className="component-row__remove" onClick={() => removeComponent(i)} aria-label="Remove component">
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost" onClick={addComponent}>
        + Add component
      </button>

      <div className={`component-total${overBudget ? ' component-total--over' : ''}`}>
        Total: ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / ₹
        {Number(draft.wageAmount || 0).toLocaleString('en-IN')}
      </div>

      <div className="modal-card__actions">
        <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save salary'}
        </button>
      </div>
    </form>
  );
}

function ProfileStat({ label, value }) {
  return (
    <div className="profile-field">
      <span className="profile-field__label">{label}</span>
      <span className="profile-field__value">{value}</span>
    </div>
  );
}
