import { ProfileField } from './ProfileField';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const MARITAL_OPTIONS = ['Single', 'Married', 'Other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function PrivateInfoTab({ profile, form, editing, editableKeys, onChange }) {
  const can = (key) => editableKeys.includes(key);

  return (
    <div className="profile-tab-panel">
      <section className="profile-section">
        <h4 className="profile-section__title">Job details</h4>
        <div className="profile-field-grid">
          <ProfileField label="Employee code" value={profile.employeeCode} editable={false} editing={editing} />
          <ProfileField label="Login email" value={profile.email} editable={false} editing={editing} />
          <ProfileField
            label="Designation"
            value={form.designation}
            editable={can('designation')}
            editing={editing}
            onChange={(v) => onChange('designation', v)}
          />
          <ProfileField
            label="Department"
            value={form.department}
            editable={can('department')}
            editing={editing}
            onChange={(v) => onChange('department', v)}
          />
          <ProfileField
            label="Date of joining"
            value={form.dateOfJoining}
            editable={can('dateOfJoining')}
            editing={editing}
            type="date"
            onChange={(v) => onChange('dateOfJoining', v)}
          />
        </div>
      </section>

      <section className="profile-section">
        <h4 className="profile-section__title">Personal details</h4>
        <div className="profile-field-grid">
          <ProfileField
            label="Date of birth"
            value={form.dob}
            editable={can('dob')}
            editing={editing}
            type="date"
            onChange={(v) => onChange('dob', v)}
          />
          <ProfileField
            label="Gender"
            value={form.gender}
            editable={can('gender')}
            editing={editing}
            type="select"
            options={GENDER_OPTIONS}
            onChange={(v) => onChange('gender', v)}
          />
          <ProfileField
            label="Marital status"
            value={form.maritalStatus}
            editable={can('maritalStatus')}
            editing={editing}
            type="select"
            options={MARITAL_OPTIONS}
            onChange={(v) => onChange('maritalStatus', v)}
          />
          <ProfileField
            label="Blood group"
            value={form.bloodGroup}
            editable={can('bloodGroup')}
            editing={editing}
            type="select"
            options={BLOOD_GROUP_OPTIONS}
            onChange={(v) => onChange('bloodGroup', v)}
          />
        </div>
      </section>

      <section className="profile-section">
        <h4 className="profile-section__title">Contact</h4>
        <div className="profile-field-grid">
          <ProfileField
            label="Mobile"
            value={form.phone}
            editable={can('phone')}
            editing={editing}
            type="tel"
            onChange={(v) => onChange('phone', v)}
          />
          <ProfileField
            label="Personal email"
            value={form.personalEmail}
            editable={can('personalEmail')}
            editing={editing}
            type="email"
            onChange={(v) => onChange('personalEmail', v)}
          />
          <ProfileField
            label="Residing address"
            value={form.residingAddress}
            editable={can('residingAddress')}
            editing={editing}
            type="textarea"
            onChange={(v) => onChange('residingAddress', v)}
          />
          <ProfileField
            label="Permanent address"
            value={form.permanentAddress}
            editable={can('permanentAddress')}
            editing={editing}
            type="textarea"
            onChange={(v) => onChange('permanentAddress', v)}
          />
        </div>
      </section>

      <section className="profile-section">
        <h4 className="profile-section__title">Identification</h4>
        <div className="profile-field-grid">
          <ProfileField
            label="PAN"
            value={form.panId}
            editable={can('panId')}
            editing={editing}
            onChange={(v) => onChange('panId', v)}
          />
          <ProfileField
            label="Aadhaar number"
            value={form.aadhaarNumber}
            editable={can('aadhaarNumber')}
            editing={editing}
            onChange={(v) => onChange('aadhaarNumber', v)}
          />
        </div>
      </section>
    </div>
  );
}
