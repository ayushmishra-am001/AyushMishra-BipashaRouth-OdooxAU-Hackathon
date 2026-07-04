import { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendance';
import { ApiError } from '../../api/client';

// The wireframe calls this the "systray" - a single button in the navbar that
// flips between Check In (red dot) and Check Out (green dot). It only cares
// about today's row for the logged-in user, which is why it fetches
// attendanceApi.list() with no arguments (server defaults to today/self).
export function CheckInOutButton() {
  const [today, setToday] = useState(null); // { checkIn, checkOut } | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const loadToday = async () => {
    try {
      const rows = await attendanceApi.list();
      setToday(rows[0] || null);
    } catch {
      // Non-fatal - the button just falls back to "Check In" and lets the
      // click itself surface any real problem.
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadToday();
  }, []);

  const checkedIn = Boolean(today?.checkIn);
  const checkedOut = Boolean(today?.checkOut);
  const done = checkedIn && checkedOut;

  const handleClick = async () => {
    if (busy || done) return;
    setBusy(true);
    setError('');
    try {
      const row = checkedIn ? await attendanceApi.checkOut() : await attendanceApi.checkIn();
      setToday(row);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return <div className="checkinout checkinout--placeholder" aria-hidden="true" />;
  }

  return (
    <div className="checkinout">
      <button
        type="button"
        className="checkinout__btn"
        onClick={handleClick}
        disabled={busy || done}
        title={error || undefined}
      >
        <span className={`checkinout__dot checkinout__dot--${checkedIn ? 'green' : 'red'}`} />
        {done ? 'Checked out' : checkedIn ? 'Check Out' : 'Check In'}
        {!done && <span className="checkinout__arrow">→</span>}
      </button>
      {error && <span className="checkinout__error">{error}</span>}
    </div>
  );
}
