/**
 * Central API client — all backend calls go through here.
 * Base URL is read from the Vite env variable VITE_API_URL,
 * falling back to http://localhost:5000/api for local dev.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('hms_token') || '';
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json.message || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return json;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  logout: () => request('POST', '/auth/logout'),
  /** Student self-service password change — verified by DOB (DDMMYYYY) */
  changePassword: (email, dateOfBirth, newPassword, confirmPassword) =>
    request('POST', '/auth/change-password', { email, dateOfBirth, newPassword, confirmPassword }),
};

// ── Hostel (blocks / floors / rooms) ─────────────────────────────────────────
export const hostel = {
  /** Returns the full block → floor → room tree with bedsOccupied counts. */
  listBlocks: (withDetails = false) => request('GET', `/hostel/blocks${withDetails ? '?withDetails=true' : ''}`),

  getBlockDetails: (blockId) => request('GET', `/hostel/blocks/${blockId}`),

  createBlock: (name) => request('POST', '/hostel/blocks', { name }),

  createFloor: (blockId, floorNumber) =>
    request('POST', `/hostel/blocks/${blockId}/floors`, { floorNumber }),

  /** Create a single room under a floor. */
  createRoom: (floorId, roomData) =>
    request('POST', `/hostel/floors/${floorId}/rooms`, roomData),

  /** Bulk-create rooms from the BulkRoomDrawer form values. */
  bulkCreateRooms: (formData) =>
    request('POST', '/hostel/rooms/bulk', formData),

  listRooms: () => request('GET', '/hostel/rooms'),

  /** Returns students currently allocated to a specific room (by room DB id). */
  getRoomStudents: (roomId) =>
    request('GET', `/hostel/rooms/${roomId}/students`),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const students = {
  list: () => request('GET', '/students'),
  getById: (id) => request('GET', `/students/${id}`),
  create: (studentData) => request('POST', '/students', studentData),
  updateStatus: (id, status) => request('PATCH', `/students/${id}/status`, { status }),
  resetPassword: (id) => request('POST', `/students/${id}/reset-password`),
};

// ── Allocations ───────────────────────────────────────────────────────────────
export const allocations = {
  allocate: (payload) => request('POST', '/allocations', payload),
  vacate: (allocationId, vacatedAt) =>
    request('PATCH', `/allocations/${allocationId}/vacate`, { vacatedAt }),
};

// ── Staff ─────────────────────────────────────────────────────────────────────
export const staff = {
  list: () => request('GET', '/staff'),
  create: (staffData) => request('POST', '/staff', staffData),
};

