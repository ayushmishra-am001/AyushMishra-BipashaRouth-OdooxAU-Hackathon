const crypto = require('crypto');

// Generates a readable-ish temporary password for accounts created by HR/Admin.
// Employee is forced to change it on first login (see users.must_change_password).
function generateTempPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
  let password = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// 6-digit email verification code shown on-screen at sign-up time (see
// schema.sql comment on users.email_verification_code for why this isn't
// emailed in this local-only build).
function generateVerificationCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

module.exports = { generateTempPassword, generateVerificationCode };
