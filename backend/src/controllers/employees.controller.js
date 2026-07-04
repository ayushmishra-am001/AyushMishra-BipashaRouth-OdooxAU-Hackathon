const employeeModel = require('../models/employee.model');
const { isValidDateString } = require('../utils/validators');

// camelCase request key -> employee_profiles column
const PROFILE_FIELD_MAP = {
  designation: 'designation',
  department: 'department',
  dob: 'dob',
  gender: 'gender',
  maritalStatus: 'marital_status',
  phone: 'phone',
  personalEmail: 'personal_email',
  bloodGroup: 'blood_group',
  panId: 'pan_id',
  aadhaarNumber: 'aadhaar_number',
  permanentAddress: 'permanent_address',
  residingAddress: 'residing_address',
  avatarUrl: 'avatar_url',
  dateOfJoining: 'date_of_joining',
  about: 'about',
  interests: 'interests',
};

// What an employee is allowed to change on their own profile.
const SELF_EDITABLE_FIELDS = ['phone', 'residingAddress', 'avatarUrl'];

function isPrivileged(role) {
  return role === 'admin' || role === 'hr';
}

function mapAttendanceStatus(status) {
  if (status === 'leave') return 'on_leave';
  if (status === 'half_day') return 'present';
  if (status === 'present') return 'present';
  return 'absent';
}

function mapProfileToResponse(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    employeeCode: row.employee_code,
    role: row.role,
    dob: row.dob,
    gender: row.gender,
    maritalStatus: row.marital_status,
    phone: row.phone,
    personalEmail: row.personal_email,
    bloodGroup: row.blood_group,
    panId: row.pan_id,
    aadhaarNumber: row.aadhaar_number,
    permanentAddress: row.permanent_address,
    residingAddress: row.residing_address,
    avatarUrl: row.avatar_url,
    designation: row.designation,
    department: row.department,
    managerId: row.manager_id,
    dateOfJoining: row.date_of_joining,
    about: row.about,
    interests: row.interests,
  };
}

async function list(req, res) {
  const rows = await employeeModel.listByCompany(req.user.companyId);

  const employees = rows.map((row) => ({
    id: row.id,
    name: row.name,
    employeeCode: row.employee_code,
    designation: row.designation,
    department: row.department,
    avatarUrl: row.avatar_url,
    status: mapAttendanceStatus(row.attendance_status),
  }));

  res.json(employees);
}

async function getById(req, res) {
  const targetId = parseInt(req.params.id, 10);

  // Any signed-in teammate can open a colleague's profile (read-only, enforced
  // by update() below and by salary.controller.js gating salary separately) -
  // the directory card grid depends on this. Company scoping in the model
  // query still keeps it to one tenant.
  const profile = await employeeModel.findProfileById(targetId, req.user.companyId);
  if (!profile) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  res.json(mapProfileToResponse(profile));
}

async function update(req, res) {
  const targetId = parseInt(req.params.id, 10);
  const actorIsPrivileged = isPrivileged(req.user.role);
  const isSelf = targetId === req.user.id;

  if (!actorIsPrivileged && !isSelf) {
    return res.status(403).json({ error: 'You do not have permission to edit this profile' });
  }

  const existing = await employeeModel.findProfileById(targetId, req.user.companyId);
  if (!existing) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const allowedKeys = actorIsPrivileged ? Object.keys(PROFILE_FIELD_MAP) : SELF_EDITABLE_FIELDS;
  const profileFields = {};

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      profileFields[PROFILE_FIELD_MAP[key]] = req.body[key];
    }
  }

  const nameUpdate = actorIsPrivileged && typeof req.body.name === 'string' && req.body.name.trim() ? req.body.name.trim() : null;

  if (Object.keys(profileFields).length === 0 && !nameUpdate) {
    return res.status(400).json({ error: 'No editable fields were provided' });
  }

  // date_of_joining and dob go straight to a DATE column - an invalid
  // calendar date (e.g. Feb 30) would otherwise reach Postgres and crash
  // with an unhandled 500 instead of a clean validation error.
  for (const [column, label] of [['date_of_joining', 'dateOfJoining'], ['dob', 'dob']]) {
    if (Object.prototype.hasOwnProperty.call(profileFields, column) && profileFields[column]) {
      if (!isValidDateString(profileFields[column])) {
        return res.status(400).json({ error: `${label} must be a valid date in YYYY-MM-DD format` });
      }
    }
  }

  if (nameUpdate) {
    await employeeModel.updateName(targetId, nameUpdate);
  }
  if (Object.keys(profileFields).length > 0) {
    await employeeModel.updateProfileFields(targetId, profileFields);
  }

  const updated = await employeeModel.findProfileById(targetId, req.user.companyId);
  res.json(mapProfileToResponse(updated));
}

module.exports = { list, getById, update };
