function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// At least 8 characters, one uppercase letter, one number.
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

module.exports = { isValidEmail, isValidPassword, isValidDateString };
