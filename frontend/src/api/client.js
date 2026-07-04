// Thin fetch wrapper shared by every API module. Keeps token attachment,
// JSON parsing and error shaping in one place instead of repeating it in
// every call site.

const BASE_URL = '/api';

let authToken = null;
let onUnauthorized = null;

// AuthContext registers itself here so a 401 from anywhere in the app can
// log the user out without every caller having to check for it.
function setAuthToken(token) {
  authToken = token;
}

function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // No-content responses (rare here, but don't blow up if one shows up).
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status);
  }

  return data;
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
};

export { setAuthToken, setUnauthorizedHandler, ApiError };
