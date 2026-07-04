import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../api/attendance';
import { ApiError } from '../api/client';
import { AttendanceTable } from '../components/attendance/AttendanceTable';
import { addDays, formatDateLong, formatRangeLabel, todayString, weekRange } from '../utils/dates';

function EmployeeAttendanceView() {
  const [mode, setMode] = useState('day'); // 'day' | 'week'
  const [anchor, setAnchor] = useState(todayString()); // any date inside the visible range
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { from, to } = useMemo(
    () => (mode === 'day' ? { from: anchor, to: anchor } : weekRange(anchor)),
    [mode, anchor]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    attendanceApi
      .list({ from, to })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load attendance.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const step = mode === 'day' ? 1 : 7;
  const goToday = () => setAnchor(todayString());

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h2>Attendance</h2>
          <p className="page-header__subtitle">Your check-in history</p>
        </div>
        <div className="page-header__actions">
          <div className="segmented">
            <button
              type="button"
              className={`segmented__option${mode === 'day' ? ' segmented__option--active' : ''}`}
              onClick={() => setMode('day')}
            >
              Day
            </button>
            <button
              type="button"
              className={`segmented__option${mode === 'week' ? ' segmented__option--active' : ''}`}
              onClick={() => setMode('week')}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <div className="attendance-nav">
        <button type="button" className="btn btn-ghost" onClick={() => setAnchor(addDays(anchor, -step))}>
          ← Previous
        </button>
        <div className="attendance-nav__label">
          {mode === 'day' ? formatDateLong(anchor) : formatRangeLabel(from, to)}
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setAnchor(addDays(anchor, step))}>
          Next →
        </button>
        <button type="button" className="btn btn-ghost" onClick={goToday}>
          Today
        </button>
      </div>

      {error && <div className="banner-error" role="alert">{error}</div>}

      {loading ? (
        <div className="loading-note">Loading attendance…</div>
      ) : (
        <AttendanceTable rows={rows} emptyMessage="No attendance recorded for this period." />
      )}
    </div>
  );
}

function CompanyAttendanceView() {
  const [date, setDate] = useState(todayString());
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    attendanceApi
      .companyForDate(date)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load attendance.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(q));
  }, [rows, search]);

  const presentCount = rows.filter((row) => row.status === 'present').length;

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h2>Attendance</h2>
          <p className="page-header__subtitle">
            {loading ? 'Loading…' : `${presentCount} of ${rows.length} present`} · {formatDateLong(date)}
          </p>
        </div>
        <div className="page-header__actions">
          <input
            className="search-input"
            type="search"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="date-input"
            type="date"
            value={date}
            max={todayString()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="attendance-nav">
        <button type="button" className="btn btn-ghost" onClick={() => setDate(addDays(date, -1))}>
          ← Previous day
        </button>
        <div className="attendance-nav__label">{formatDateLong(date)}</div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setDate(addDays(date, 1))}
          disabled={date >= todayString()}
        >
          Next day →
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setDate(todayString())}>
          Today
        </button>
      </div>

      {error && <div className="banner-error" role="alert">{error}</div>}

      {loading ? (
        <div className="loading-note">Loading attendance…</div>
      ) : (
        <AttendanceTable
          rows={filtered}
          showEmployeeColumn
          emptyMessage={search ? 'No one matches that search.' : 'No employees found.'}
        />
      )}
    </div>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'hr';
  return isPrivileged ? <CompanyAttendanceView /> : <EmployeeAttendanceView />;
}
