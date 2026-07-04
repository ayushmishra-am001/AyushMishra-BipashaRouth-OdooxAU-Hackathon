function todayString() {
  return new Date().toISOString().slice(0, 10);
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
