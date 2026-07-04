import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || '';
  const devCode = location.state?.devVerificationCode;

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email || !code) {
      setError('Enter the email and the 6-digit code.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyEmail({ email: email.trim(), code: code.trim() });
      navigate('/employees', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify this code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="One more step"
      title="Verify your email"
      subtitle="Enter the 6-digit code to activate your company account before signing in."
    >
      <form className="auth-layout__form" onSubmit={handleSubmit} noValidate>
        {error && <div className="banner-error" role="alert">{error}</div>}

        {devCode && (
          <div className="banner-success" role="status">
            This local build has no email service, so your code is shown here instead of being
            emailed: <strong>{devCode}</strong>
          </div>
        )}

        <div className="field">
          <label htmlFor="verify-email">Email</label>
          <input
            id="verify-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        <div className="field">
          <label htmlFor="verify-code">Verification code</label>
          <input
            id="verify-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Verifying…' : 'Verify and continue'}
        </button>
      </form>

      <div className="auth-layout__footer-link">
        Already verified? <Link to="/sign-in">Sign in</Link>
      </div>
    </AuthLayout>
  );
}
