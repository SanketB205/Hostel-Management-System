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

  deleteRoom: (roomId) =>
    request('DELETE', `/hostel/rooms/${roomId}`),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const students = {
  list: (params) => request('GET', `/students${params?.date ? `?date=${params.date}` : ''}`),
  getById: (id) => request('GET', `/students/${id}`),
  create: (studentData) => request('POST', '/students', studentData),
  update: (id, studentData) => request('PUT', `/students/${id}`, studentData),
  updateStatus: (id, status) => request('PATCH', `/students/${id}/status`, { status }),
  /** Admin resets a student's password back to their DOB (DDMMYYYY) */
  resetPassword: (id) => request('POST', `/students/${id}/reset-password`),
  attendanceAnalytics: (date, range) => {
    let url = `/students/attendance/analytics?date=${date || ''}`;
    if (range) {
      url += `&range=${range}`;
    }
    return request('GET', url);
  },
  delete: (id) => request('DELETE', `/students/${id}`),
  createPaymentOrder: (id, amount) => request('POST', `/students/${id}/payment/order`, { amount }),
  verifyPayment: (id, payload) => request('POST', `/students/${id}/payment/verify`, payload),
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
  getById: (id) => request('GET', `/staff/${id}`),
  create: (staffData) => request('POST', '/staff', staffData),
};

// ── Complaints ────────────────────────────────────────────────────────────────
export const complaints = {
  /** Student: raise a new complaint */
  raise: (data) => request('POST', '/complaints/my', data),

  /** Student: list own complaints with optional filters */
  listMine: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v && v !== 'All')
    ).toString();
    return request('GET', `/complaints/my${qs ? `?${qs}` : ''}`);
  },

  /** Student: get a single own complaint by id */
  getMine: (id) => request('GET', `/complaints/my/${id}`),

  /** Admin / Rector: list all complaints with optional filters */
  listAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v && v !== 'All')
    ).toString();
    return request('GET', `/complaints${qs ? `?${qs}` : ''}`);
  },

  /** Admin / Rector: get any complaint by id */
  get: (id) => request('GET', `/complaints/${id}`),

  /** Admin / Rector: update status / assign / resolve */
  update: (id, data) => request('PATCH', `/complaints/${id}`, data),

  /** Admin / Rector: delete a complaint */
  delete: (id) => request('DELETE', `/complaints/${id}`),
};


// ── Bootstrap / Demo utilities ────────────────────────────────────────────────
export const bootstrap = {
  /** Admin only: delete today's attendance records → all students revert to Not Marked */
  clearTodayAttendance: () => request('DELETE', '/bootstrap/attendance/today'),
};
