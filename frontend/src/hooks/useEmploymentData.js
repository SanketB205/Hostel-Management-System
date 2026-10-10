import { useState, useEffect } from 'react';

// ─── Module-level defaults ────────────────────────────────────────────────────
const DEFAULT_DESIGNATIONS = [
  { id: '1', name: 'Warden',            status: 'Active' },
  { id: '2', name: 'Assistant Warden',  status: 'Active' },
  { id: '3', name: 'Security Guard',    status: 'Active' },
  { id: '4', name: 'Maintenance Staff', status: 'Active' },
  { id: '5', name: 'Housekeeping',      status: 'Active' },
];

const DEFAULT_EMPLOYMENT_TYPES = [
  { id: '1', name: 'Full-Time', status: 'Active' },
  { id: '2', name: 'Part-Time', status: 'Active' },
  { id: '3', name: 'Contract',  status: 'Active' },
  { id: '4', name: 'Temporary', status: 'Active' },
];

// ─── Module-level subscriber registry ────────────────────────────────────────
const subscribers = new Set();

export function notifyEmploymentDataChanged() {
  subscribers.forEach(fn => fn());
}

// ─── Read helpers ─────────────────────────────────────────────────────────────
function getDesignations() {
  try {
    const raw = localStorage.getItem('staffDesignations');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  localStorage.setItem('staffDesignations', JSON.stringify(DEFAULT_DESIGNATIONS));
  return DEFAULT_DESIGNATIONS;
}

function getEmploymentTypes() {
  try {
    const raw = localStorage.getItem('staffEmploymentTypes');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  localStorage.setItem('staffEmploymentTypes', JSON.stringify(DEFAULT_EMPLOYMENT_TYPES));
  return DEFAULT_EMPLOYMENT_TYPES;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useEmploymentData() {
  const [designations,    setDesignations]    = useState(getDesignations);
  const [employmentTypes, setEmploymentTypes] = useState(getEmploymentTypes);

  useEffect(() => {
    const refresh = () => {
      setDesignations([...getDesignations()]);
      setEmploymentTypes([...getEmploymentTypes()]);
    };

    subscribers.add(refresh);
    return () => subscribers.delete(refresh);
  }, []);

  const activeDesignations    = designations.filter(d => d.status === 'Active');
  const activeEmploymentTypes = employmentTypes.filter(e => e.status === 'Active');

  return { designations, employmentTypes, activeDesignations, activeEmploymentTypes };
}
