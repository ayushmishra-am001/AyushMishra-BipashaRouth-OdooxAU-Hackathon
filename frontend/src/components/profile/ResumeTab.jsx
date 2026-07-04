import { ProfileField } from './ProfileField';

export function ResumeTab({ form, editing, editableKeys, onChange }) {
  return (
    <div className="profile-tab-panel">
      <ProfileField
        label="About"
        value={form.about}
        editable={editableKeys.includes('about')}
        editing={editing}
        type="textarea"
        onChange={(v) => onChange('about', v)}
      />
      <ProfileField
        label="Interests & hobbies"
        value={form.interests}
        editable={editableKeys.includes('interests')}
        editing={editing}
        type="textarea"
        onChange={(v) => onChange('interests', v)}
      />
    </div>
  );
}
