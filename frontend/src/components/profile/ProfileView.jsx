import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeesApi } from '../../api/employees';
import { ApiError } from '../../api/client';
import { ResumeTab } from './ResumeTab';
import { PrivateInfoTab } from './PrivateInfoTab';
import { SalaryTab } from './SalaryTab';
import { SecurityTab } from './SecurityTab';

// Every key an admin/hr actor is allowed to change (mirrors
// PROFILE_FIELD_MAP in backend/src/controllers/employees.controller.js).
const PRIVILEGED_KEYS = [
  'designation', 'department', 'dob', 'gender', 'maritalStatus', 'phone',
  'personalEmail', 'bloodGroup', 'panId', 'aadhaarNumber', 'permanentAddress',
  'residingAddress', 'avatarUrl', 'dateOfJoining', 'about', 'interests',
];
const SELF_ONLY_KEYS = ['phone', 'residingAddress', 'avatarUrl'];

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function draftFromProfile(profile) {
  const draft = {};
  for (const key of ['name', ...PRIVILEGED_KEYS]) {
    draft[key] = profile[key] ?? '';
  }
  return draft;
}

export function ProfileView({ employeeId, showBackLink = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSelf = Number(employeeId) === user?.id;
  const isPrivileged = user?.role === 'admin' || user?.role === 'hr';
  const canEdit = isSelf || isPrivileged;
  const editableKeys = isPrivileged ? ['name', ...PRIVILEGED_KEYS] : isSelf ? SELF_ONLY_KEYS : [];

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState('resume');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setEditing(false);
    setActiveTab('resume');

    employeesApi
      .getById(employeeId)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setForm(draftFromProfile(data));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : 'Could not load this profile.');
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const startEditing = () => {
    setSaveError('');
    setForm(draftFromProfile(profile));
    setEditing(true);
  };

  const cancelEditing = () => {
    setForm(draftFromProfile(profile));
    setEditing(false);
    setSaveError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {};
      for (const key of editableKeys) {
        payload[key] = form[key];
      }
      const updated = await employeesApi.update(employeeId, payload);
      setProfile(updated);
      setForm(draftFromProfile(updated));
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save these changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-note">Loading profile…</div>;
  if (loadError) return <div className="banner-error" role="alert">{loadError}</div>;
  if (!profile) return null;

  const tabs = [
    { key: 'resume', label: 'Resume' },
    { key: 'private', label: 'Private Info' },
    ...(isPrivileged ? [{ key: 'salary', label: 'Salary Info' }] : []),
    ...(isSelf ? [{ key: 'security', label: 'Security' }] : []),
  ];

  return (
    <div className="profile-view">
      {showBackLink && (
        <button type="button" className="profile-view__back" onClick={() => navigate(-1)}>
          ← Back to directory
        </button>
      )}

      <div className="profile-header">
        <span className="profile-header__avatar">
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials(profile.name)}
        </span>
        <div className="profile-header__info">
          {editing && editableKeys.includes('name') ? (
            <input
              className="profile-header__name-input"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          ) : (
            <h2 className="profile-header__name">{profile.name}</h2>
          )}
          <p className="profile-header__meta">
            {profile.designation || 'No designation set'} {profile.department ? `· ${profile.department}` : ''}
          </p>
        </div>

        {canEdit && !editing && (
          <button type="button" className="btn btn-ghost" onClick={startEditing}>
            Edit
          </button>
        )}
        {editing && (
          <div className="profile-header__actions">
            <button type="button" className="btn btn-ghost" onClick={cancelEditing} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {saveError && <div className="banner-error" role="alert">{saveError}</div>}

      <div className="profile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`profile-tabs__tab${activeTab === tab.key ? ' profile-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resume' && (
        <ResumeTab form={form} editing={editing} editableKeys={editableKeys} onChange={setField} />
      )}
      {activeTab === 'private' && (
        <PrivateInfoTab profile={profile} form={form} editing={editing} editableKeys={editableKeys} onChange={setField} />
      )}
      {activeTab === 'salary' && isPrivileged && <SalaryTab userId={employeeId} />}
      {activeTab === 'security' && isSelf && <SecurityTab />}
    </div>
  );
}
