import { AlignmentGrid } from './AlignmentGrid';

export function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <div className="auth-layout__brand-inner">
          <div className="auth-layout__wordmark">HRMS</div>
          <AlignmentGrid />
          <p className="auth-layout__tagline">Every workday, perfectly aligned.</p>
        </div>
      </div>

      <div className="auth-layout__form-side">
        <div className="auth-layout__card">
          {eyebrow && <div className="auth-layout__eyebrow">{eyebrow}</div>}
          <h1 className="auth-layout__title">{title}</h1>
          {subtitle && <p className="auth-layout__subtitle">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
