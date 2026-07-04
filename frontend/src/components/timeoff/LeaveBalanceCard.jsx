// One card per leave type, matching the wireframe's "Paid Time Off - 24 Days
// Available" / "Sick Leave - 07 Days Available" cards.
export function LeaveBalanceCard({ balance }) {
  const isUnpaid = balance.name.toLowerCase().includes('unpaid');

  return (
    <div className="leave-balance-card">
      <div className="leave-balance-card__name">{balance.name}</div>
      {isUnpaid ? (
        <div className="leave-balance-card__unlimited">No balance limit</div>
      ) : (
        <>
          <div className="leave-balance-card__remaining">{balance.remainingDays}</div>
          <div className="leave-balance-card__meta">
            of {balance.allocatedDays} days available
          </div>
        </>
      )}
    </div>
  );
}
