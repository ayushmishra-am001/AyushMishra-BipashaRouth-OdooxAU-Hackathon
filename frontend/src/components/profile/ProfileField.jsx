// Renders as plain text normally, and as an input/select/textarea when the
// profile is in edit mode AND the viewer is allowed to change this field.
// Keeping locked fields visible-but-static (rather than hiding them) matches
// the wireframe, which shows every field on the card even for a read-only view.
export function ProfileField({ label, value, editable, editing, type = 'text', options, onChange }) {
  const showInput = editing && editable;

  return (
    <div className="profile-field">
      <span className="profile-field__label">{label}</span>
      {showInput ? (
        type === 'select' ? (
          <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} />
        )
      ) : (
        <span className={`profile-field__value${!value ? ' profile-field__value--empty' : ''}`}>
          {value || 'Not set'}
        </span>
      )}
    </div>
  );
}
