// Small date helpers shared by the attendance views. Kept dependency-free
// (no date-fns/dayjs) since this is the only place that needs them.

function pad(n) {
  return String(n).padStart(2, '0');
}

// Local-time YYYY-MM-DD, matching what the backend expects and returns.
export function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayString() {
  return toDateString(new Date());
}

export function parseDateString(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateString, days) {
  const date = parseDateString(dateString);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

// Monday-to-Sunday week containing the given date.
export function weekRange(dateString) {
  const date = parseDateString(dateString);
  const day = date.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { from: toDateString(start), to: toDateString(end) };
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// e.g. "Sat, 4 Jul 2026"
export function formatDateLong(dateString) {
  const date = parseDateString(dateString);
  return `${WEEKDAY_LABELS[date.getDay()]}, ${date.getDate()} ${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

// e.g. "4 Jul" - used in table rows where the year is implied.
export function formatDateShort(dateString) {
  const date = parseDateString(dateString);
  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`;
}

export function formatRangeLabel(from, to) {
  if (from === to) return formatDateLong(from);
  return `${formatDateShort(from)} – ${formatDateShort(to)}`;
}

// Mirrors backend/src/utils/dateHelpers.js daysBetweenInclusive exactly, so
// the leave request form can show the same day count the server will
// validate against instead of a client-side estimate that might disagree.
export function daysBetweenInclusive(startDate, endDate) {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}
