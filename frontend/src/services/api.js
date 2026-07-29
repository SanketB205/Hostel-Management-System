const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...options.headers },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Request failed.');
  return body;
}

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: (token) => request('/auth/me', { token }),
  logout: (token) => request('/auth/logout', { method: 'POST', token }),
};

export const importLocalStorage = (token) => {
  const parse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  return request('/bootstrap/local-storage', { method: 'POST', token, body: JSON.stringify({ blocks: parse('hostel_blocks', []), students: parse('hostel_students', []) }) });
};

export const studentsApi = {
  create: (student, token) => request('/students', { method: 'POST', token, body: JSON.stringify(student) }),
};
