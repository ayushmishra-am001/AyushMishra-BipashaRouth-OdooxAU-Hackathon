import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { isValidPassword, PASSWORD_RULE_MESSAGE } from '../utils/validation';

export default function ChangePassword() {
  const { user, changePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const forced = Boolean(user?.mustChangePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

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
      navigate('/employees', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow={forced ? 'One more step' : 'Account'}
      title={forced ? 'Set a new password' : 'Change your password'}
      subtitle={
        forced
          ? 'Your account was created with a temporary password. Choose a new one to continue.'
          : 'Update the password you use to sign in.'
      }
    >
      <form className="auth-layout__form" onSubmit={handleSubmit} noValidate>
        {error && <div className="banner-error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="currentPassword">{forced ? 'Temporary password' : 'Current password'}</label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <span className="field-hint">{PASSWORD_RULE_MESSAGE}</span>
        </div>

        <div className="field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save new password'}
        </button>

        {!forced && (
          <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate(-1)}>
            Cancel
          </button>
        )}
      </form>

      {forced && (
        <div className="auth-layout__footer-link">
          Wrong account? <button type="button" onClick={signOut}>Sign out</button>
        </div>
      )}
    </AuthLayout>
  );
}
