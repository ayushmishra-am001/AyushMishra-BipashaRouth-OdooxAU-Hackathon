// Local calendar date as YYYY-MM-DD. Deliberately NOT toISOString().slice(0,10) -
// toISOString() is always UTC, so on a server running in a timezone ahead of
// UTC (e.g. IST, UTC+5:30), a request made just after local midnight would
// still get *yesterday's* UTC date, silently breaking any local-date
// comparison (e.g. rejecting a same-day leave request as "in the past").
function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Inclusive day count between two YYYY-MM-DD strings, e.g. Mon-Mon = 1, Mon-Fri = 5.
// Assumes calendar days, not working days (contract doesn't specify working-day rules).
function daysBetweenInclusive(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

module.exports = { todayString, daysBetweenInclusive };
