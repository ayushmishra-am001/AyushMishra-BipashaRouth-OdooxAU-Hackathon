-- HRMS schema
-- Run via: npm run migrate

CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'employee')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  -- Self-signed-up admins must verify their email before they can log in
  -- (requirement 3.1.1). Accounts created internally by an Admin/HR officer
  -- (users.controller.js) are provisioned already verified, since the
  -- employer vouches for that address the same way it hands out the temp
  -- password - see README for why this build shows the code on-screen
  -- instead of emailing it (no SMTP/third-party service in this stack).
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_code TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Safe to re-run: adds the columns above to a database that was migrated
-- before they existed, without touching any other data.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_code TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

CREATE TABLE IF NOT EXISTS employee_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  dob DATE,
  gender TEXT,
  marital_status TEXT,
  phone TEXT,
  personal_email TEXT,
  blood_group TEXT,
  pan_id TEXT,
  aadhaar_number TEXT,
  permanent_address TEXT,
  residing_address TEXT,
  avatar_url TEXT,
  designation TEXT,
  department TEXT,
  manager_id INTEGER REFERENCES users(id),
  date_of_joining DATE NOT NULL,
  about TEXT,
  interests TEXT
);

CREATE TABLE IF NOT EXISTS salary_structures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  wage_type TEXT NOT NULL CHECK (wage_type IN ('monthly', 'yearly')),
  wage_amount NUMERIC(12, 2) NOT NULL,
  working_days_per_week INTEGER NOT NULL DEFAULT 5,
  pf_rate NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
  professional_tax NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_components (
  id SERIAL PRIMARY KEY,
  salary_structure_id INTEGER NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calc_type TEXT NOT NULL CHECK (calc_type IN ('fixed', 'percentage')),
  value NUMERIC(10, 3) NOT NULL,
  computed_amount NUMERIC(12, 2)
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  work_hours NUMERIC(5, 2),
  extra_hours NUMERIC(5, 2),
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);

CREATE TABLE IF NOT EXISTS leave_types (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_allocation_days INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  allocated_days NUMERIC(5, 1) NOT NULL,
  used_days NUMERIC(5, 1) NOT NULL DEFAULT 0,
  UNIQUE(user_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  remarks TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
