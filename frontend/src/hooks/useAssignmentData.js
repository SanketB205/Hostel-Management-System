import { useState, useEffect } from 'react';

// ─── Module-level defaults ────────────────────────────────────────────────────
const DEFAULT_AREAS = [
  { id: '1', name: 'Hostel Block', status: 'Active' },
  { id: '2', name: 'Main Gate',    status: 'Active' },
  { id: '3', name: 'Mess Area',    status: 'Active' },
  { id: '4', name: 'Office',       status: 'Active' },
  { id: '5', name: 'Common Area',  status: 'Active' },
  { id: '6', name: 'Other',        status: 'Active' },
];

const DEFAULT_SHIFTS = [
  { id: '1', name: 'Morning Shift (06:00 - 14:00)', status: 'Active', fullData: { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', lateGracePeriod: '15', halfDayAfter: '', earlyClockIn: '15', earlyClockOut: '15', monthlyGraceDays: '3', lunchBreak: '45', teaBreak: '15' } },
  { id: '2', name: 'Evening Shift (14:00 - 22:00)', status: 'Active', fullData: { name: 'Evening Shift', startTime: '14:00', endTime: '22:00', lateGracePeriod: '15', halfDayAfter: '', earlyClockIn: '15', earlyClockOut: '15', monthlyGraceDays: '3', lunchBreak: '45', teaBreak: '15' } },
  { id: '3', name: 'Night Shift (22:00 - 06:00)',   status: 'Active', fullData: { name: 'Night Shift',   startTime: '22:00', endTime: '06:00', lateGracePeriod: '15', halfDayAfter: '', earlyClockIn: '15', earlyClockOut: '15', monthlyGraceDays: '3', lunchBreak: '30', teaBreak: '15' } },
  { id: '4', name: 'General Shift (09:00 - 17:00)', status: 'Active', fullData: { name: 'General Shift', startTime: '09:00', endTime: '17:00', lateGracePeriod: '15', halfDayAfter: '', earlyClockIn: '15', earlyClockOut: '15', monthlyGraceDays: '3', lunchBreak: '45', teaBreak: '15' } },
];

// ─── Module-level subscriber registry ────────────────────────────────────────
// All mounted instances of useAssignmentData register here.
// When the modal calls notifyAssignmentDataChanged(), every subscriber re-reads
// localStorage and updates its own state — no stale closure possible.
const subscribers = new Set();

export function notifyAssignmentDataChanged() {
  subscribers.forEach(fn => fn());
}

// ─── Read helpers ─────────────────────────────────────────────────────────────
function getAreas() {
  try {
    const raw = localStorage.getItem('staffAssignedAreas');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  localStorage.setItem('staffAssignedAreas', JSON.stringify(DEFAULT_AREAS));
  return DEFAULT_AREAS;
}

function getShifts() {
  try {
    const raw = localStorage.getItem('staffShifts');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  localStorage.setItem('staffShifts', JSON.stringify(DEFAULT_SHIFTS));
  return DEFAULT_SHIFTS;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAssignmentData() {
  const [assignedAreas, setAssignedAreas] = useState(getAreas);
  const [shifts,        setShifts]        = useState(getShifts);

  useEffect(() => {
    // Each mount registers a refresh callback
    const refresh = () => {
      setAssignedAreas([...getAreas()]);
      setShifts([...getShifts()]);
    };

    subscribers.add(refresh);
    return () => subscribers.delete(refresh);
  }, []);

  const activeAssignedAreas = assignedAreas.filter(a => a.status === 'Active');
  const activeShifts        = shifts.filter(s => s.status === 'Active');

  return { assignedAreas, shifts, activeAssignedAreas, activeShifts };
}
