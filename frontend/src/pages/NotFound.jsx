import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1 style={{ fontSize: 48 }}>404</h1>
      <p>That page doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Back to HRMS</Link>
    </div>
  );
}
