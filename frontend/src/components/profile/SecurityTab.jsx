import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/client';
import { isValidPassword, PASSWORD_RULE_MESSAGE } from '../../utils/validation';

export function SecurityTab() {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword) {
      setError('Fill in both password fields.');
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError(PASSWORD_RULE_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="profile-tab-panel security-form" onSubmit={handleSubmit} noValidate>
      <h4 className="profile-section__title">Change password</h4>
      {error && <div className="banner-error" role="alert">{error}</div>}
      {success && <div className="banner-success" role="status">Password updated.</div>}

      <div className="field">
        <label htmlFor="sec-current">Current password</label>
        <input
          id="sec-current"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="sec-new">New password</label>
        <input
          id="sec-new"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <span className="field-hint">{PASSWORD_RULE_MESSAGE}</span>
      </div>
      <div className="field">
        <label htmlFor="sec-confirm">Confirm new password</label>
        <input
          id="sec-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Saving…' : 'Update password'}
      </button>
    </form>
  );
}
