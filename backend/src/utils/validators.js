function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// At least 8 characters, one uppercase letter, one number.
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

// Rejects calendar-invalid dates (e.g. 2026-02-30). Note: new Date('2026-02-30')
// does NOT reliably return an Invalid Date in Node/V8 - it silently rolls over
// to 2026-03-02, so checking Number.isNaN(parsed.getTime()) is not sufficient.
// This validates by re-deriving the date from its own year/month/day and
// confirming the round-trip matches what was passed in.
function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

module.exports = { isValidEmail, isValidPassword, isValidDateString };
