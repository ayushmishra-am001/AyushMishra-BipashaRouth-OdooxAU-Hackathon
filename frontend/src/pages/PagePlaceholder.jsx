// Shared shell for the three module pages until Steps 6-8 build them out.
export function PagePlaceholder({ title, description }) {
  return (
    <div className="page-placeholder">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
