import { STORAGE_KEYS } from './constants';

export function loadVisits() {
  const raw = localStorage.getItem(STORAGE_KEYS.VISITS);
  if (!raw) return [];
  try {
    const visits = JSON.parse(raw);
    return Array.isArray(visits) ? visits : [];
  } catch {
    return [];
  }
}

export function saveVisits(visits) {
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
}

export function generateVisitId() {
  return `visit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatINR(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDuration(hours, minutes) {
  const h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (parts.length === 0) return '0m';
  return parts.join(' ');
}

export function durationToMinutes(hours, minutes) {
  return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
}

export function minutesToHoursDecimal(totalMinutes) {
  return Math.round((totalMinutes / 60) * 100) / 100;
}

export function computeSummary(visits) {
  const totalVisits = visits.length;
  let totalMinutes = 0;
  let totalRevenue = 0;

  visits.forEach((visit) => {
    totalMinutes += durationToMinutes(visit.durationHours, visit.durationMinutes);
    totalRevenue += Number(visit.payoutAmount) || 0;
  });

  return {
    totalVisits,
    totalHours: minutesToHoursDecimal(totalMinutes),
    totalRevenue,
    totalMinutes,
  };
}

export function formatDisplayDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
