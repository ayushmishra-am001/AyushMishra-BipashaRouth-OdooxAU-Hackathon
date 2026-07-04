import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveApi } from '../api/leave';
import { ApiError } from '../api/client';
import { LeaveBalanceCard } from '../components/timeoff/LeaveBalanceCard';
import { ApplyLeaveModal } from '../components/timeoff/ApplyLeaveModal';
import { LeaveRequestTable } from '../components/timeoff/LeaveRequestTable';
import { AllocationTab } from '../components/timeoff/AllocationTab';

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
  const [view, setView] = useState('requests'); // 'requests' | 'allocation' - wireframe's Time Off | Allocation tabs
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
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

  const loadLeaveTypes = async () => {
    try {
      const types = await leaveApi.listTypes();
      setLeaveTypes(types);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load leave types.');
    }
  };

  useEffect(() => {
    loadRequests(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) => r.userName?.toLowerCase().includes(q) || r.leaveTypeName?.toLowerCase().includes(q)
    );
  }, [requests, search]);

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
            {view === 'requests'
              ? loading
                ? 'Loading…'
                : `${pendingCount} pending request${pendingCount === 1 ? '' : 's'}`
              : 'Manage default leave allocations'}
          </p>
        </div>
        <div className="page-header__actions">
          <div className="segmented">
            <button
              type="button"
              className={`segmented__option${view === 'requests' ? ' segmented__option--active' : ''}`}
              onClick={() => setView('requests')}
            >
              Time Off
            </button>
            <button
              type="button"
              className={`segmented__option${view === 'allocation' ? ' segmented__option--active' : ''}`}
              onClick={() => setView('allocation')}
            >
              Allocation
            </button>
          </div>
        </div>
      </div>

      {error && <div className="banner-error" role="alert">{error}</div>}

      {view === 'requests' ? (
        <>
          <div className="time-off-toolbar">
            <input
              className="search-input"
              type="search"
              placeholder="Search by employee or leave type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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

          {actionError && <div className="banner-error" role="alert">{actionError}</div>}

          {loading ? (
            <div className="loading-note">Loading time off requests…</div>
          ) : (
            <LeaveRequestTable
              requests={filteredRequests}
              showEmployeeColumn
              busyId={busyId}
              onApprove={(id) => handleReview(id, 'approve')}
              onReject={(id) => handleReview(id, 'reject')}
              emptyMessage={search ? 'No requests match your search.' : 'No requests match this filter.'}
            />
          )}
        </>
      ) : (
        <AllocationTab leaveTypes={leaveTypes} onSaved={loadLeaveTypes} />
      )}
    </div>
  );
}

export default function TimeOffPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'hr';
  return isPrivileged ? <CompanyTimeOffView /> : <EmployeeTimeOffView />;
}
