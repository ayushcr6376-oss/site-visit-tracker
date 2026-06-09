import { supabase } from '../lib/supabase';

function mapVisitFromDb(row) {
  return {
    id: row.id,
    visitDate: row.visit_date,
    durationHours: row.duration_hours,
    durationMinutes: row.duration_minutes,
    clientCompany: row.client_company,
    parentCompany: row.parent_company,
    payoutAmount: Number(row.payout_amount),
    visitType: row.visit_type,
    keyTask: row.key_task,
    status: row.status,
    signature: row.signature,
    createdAt: row.created_at,
  };
}

function mapVisitToDb(userId, visitData) {
  return {
    user_id: userId,
    visit_date: visitData.visitDate,
    duration_hours: visitData.durationHours,
    duration_minutes: visitData.durationMinutes,
    client_company: visitData.clientCompany.trim(),
    parent_company: visitData.parentCompany.trim(),
    payout_amount: visitData.payoutAmount,
    visit_type: visitData.visitType,
    key_task: visitData.keyTask.trim(),
    status: visitData.status,
    signature: visitData.signature || null,
  };
}

export async function fetchVisits(userId) {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapVisitFromDb);
}

export async function createVisit(userId, visitData) {
  const { data, error } = await supabase
    .from('visits')
    .insert(mapVisitToDb(userId, visitData))
    .select()
    .single();

  if (error) throw error;
  return mapVisitFromDb(data);
}

export async function deleteVisitById(visitId) {
  const { error } = await supabase.from('visits').delete().eq('id', visitId);
  if (error) throw error;
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
