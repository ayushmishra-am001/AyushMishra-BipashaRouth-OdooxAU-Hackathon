import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveApi } from '../api/leave';
import { ApiError } from '../api/client';
import { LeaveBalanceCard } from '../components/timeoff/LeaveBalanceCard';
import { ApplyLeaveModal } from '../components/timeoff/ApplyLeaveModal';
import { LeaveRequestTable } from '../components/timeoff/LeaveRequestTable';

function EmployeeTimeOffView() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [types, balanceRows, requestRows] = await Promise.all([
        leaveApi.listTypes(),
        leaveApi.listBalances(),
        leaveApi.listMyRequests(),
      ]);
      setLeaveTypes(types);
      setBalances(balanceRows);
      setRequests(requestRows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your time off.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="time-off-page">
      <div className="page-header">
        <div>
          <h2>Time Off</h2>
          <p className="page-header__subtitle">Your leave balances and requests</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
            + New request
          </button>
        </div>
      </div>

      {error && <div className="banner-error" role="alert">{error}</div>}

      {loading ? (
        <div className="loading-note">Loading time off…</div>
      ) : (
        <>
          <div className="leave-balance-grid">
            {balances.map((balance) => (
              <LeaveBalanceCard key={balance.leaveTypeId} balance={balance} />
            ))}
          </div>

          <h3 className="section-heading">Request history</h3>
          <LeaveRequestTable requests={requests} emptyMessage="You haven't requested any time off yet." />
        </>
      )}

      {showApplyModal && (
        <ApplyLeaveModal
          leaveTypes={leaveTypes}
          balances={balances}
          onClose={() => setShowApplyModal(false)}
          onSubmitted={loadAll}
        />
      )}
    </div>
  );
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function CompanyTimeOffView() {
  const [status, setStatus] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadRequests = async (currentStatus) => {
    setLoading(true);
    setError('');
    try {
      const rows = await leaveApi.listCompanyRequests(currentStatus || undefined);
      setRequests(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load time off requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests]);

  const handleReview = async (id, action) => {
    setBusyId(id);
    setActionError('');
    try {
      await (action === 'approve' ? leaveApi.approve(id) : leaveApi.reject(id));
      await loadRequests(status);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update this request.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="time-off-page">
      <div className="page-header">
        <div>
          <h2>Time Off</h2>
          <p className="page-header__subtitle">
            {loading ? 'Loading…' : `${pendingCount} pending request${pendingCount === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="page-header__actions">
          <div className="segmented">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`segmented__option${status === filter.value ? ' segmented__option--active' : ''}`}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="banner-error" role="alert">{error}</div>}
      {actionError && <div className="banner-error" role="alert">{actionError}</div>}

      {loading ? (
        <div className="loading-note">Loading time off requests…</div>
      ) : (
        <LeaveRequestTable
          requests={requests}
          showEmployeeColumn
          busyId={busyId}
          onApprove={(id) => handleReview(id, 'approve')}
          onReject={(id) => handleReview(id, 'reject')}
          emptyMessage="No requests match this filter."
        />
      )}
    </div>
  );
}

export default function TimeOffPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'hr';
  return isPrivileged ? <CompanyTimeOffView /> : <EmployeeTimeOffView />;
}
