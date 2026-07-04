import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { isValidEmail, isValidPassword, PASSWORD_RULE_MESSAGE } from '../utils/validation';

const initialForm = { companyName: '', name: '', email: '', password: '', confirmPassword: '' };

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!form.companyName.trim()) errors.companyName = 'Company name is required.';
    if (!form.name.trim()) errors.name = 'Your name is required.';
    if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address.';
    if (!isValidPassword(form.password)) errors.password = PASSWORD_RULE_MESSAGE;
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await signUp({
        companyName: form.companyName.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/employees', { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="New company"
      title="Create your company"
      subtitle="This creates your company and its first admin account. Employees are added later from inside the app — there's no public sign-up for them."
    >
      <form className="auth-layout__form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="banner-error" role="alert">{formError}</div>}

        <div className="field">
          <label htmlFor="companyName">Company name</label>
          <input
            id="companyName"
            value={form.companyName}
            onChange={updateField('companyName')}
            className={fieldErrors.companyName ? 'has-error' : ''}
            placeholder="Acme Industries"
          />
          {fieldErrors.companyName && <span className="field-error">{fieldErrors.companyName}</span>}
        </div>

        <div className="field">
          <label htmlFor="name">Your full name</label>
          <input
            id="name"
            value={form.name}
            onChange={updateField('name')}
            className={fieldErrors.name ? 'has-error' : ''}
            placeholder="Jordan Doe"
          />
          {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">Work email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField('email')}
            className={fieldErrors.email ? 'has-error' : ''}
            placeholder="you@company.com"
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={updateField('password')}
            className={fieldErrors.password ? 'has-error' : ''}
            placeholder="••••••••"
          />
          {fieldErrors.password ? (
            <span className="field-error">{fieldErrors.password}</span>
          ) : (
            <span className="field-hint">{PASSWORD_RULE_MESSAGE}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={updateField('confirmPassword')}
            className={fieldErrors.confirmPassword ? 'has-error' : ''}
            placeholder="••••••••"
          />
          {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create company account'}
        </button>
      </form>

      <div className="auth-layout__footer-link">
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </div>
    </AuthLayout>
  );
}
