// Mirrors backend/src/utils/validators.js so the form can tell someone what's
// wrong before a round trip to the server, not just repeat the server's error.

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

export const PASSWORD_RULE_MESSAGE =
  'At least 8 characters, with one uppercase letter and one number.';
