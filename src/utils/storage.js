import { supabase } from '../supabase';

export function normalizeStatus(status) {
  const value = (status || '').toLowerCase().trim();
  if (value === 'completed' || value === 'paid') return 'completed';
  return 'pending';
}

export function stripKeyTaskPrefix(keyTask) {
  if (!keyTask) return '';
  return keyTask.replace(/^\[IN:\s*.+?\s*\|\s*OUT:\s*.+?\]\s*/i, '').trim();
}

function parseTime12h(timeStr) {
  if (!timeStr) return null;
  // Handle strings like "09:00 AM" or "9:00AM" safely
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function visitDurationMinutes(visit) {
  if (!visit) return 0;
  // Database format checks
  const inStr = visit.check_in || visit.checkIn;
  const outStr = visit.check_out || visit.checkOut;
  
  const inMinutes = parseTime12h(inStr);
  const outMinutes = parseTime12h(outStr);
  
  if (inMinutes == null || outMinutes == null) return 0;

  let diff = outMinutes - inMinutes;
  if (diff < 0) diff += 24 * 60; // Over-night shifts safety fallback
  return diff;
}

export async function fetchVisits() {
  const { data, error } = await supabase
    .from('site_visits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    ...row,
    status: normalizeStatus(row.status),
  }));
}

export async function createVisit(visitData) {
  const payload = {
    date: visitData.date,
    site_name: visitData.site_name?.trim(),
    parent_company: visitData.parent_company?.trim() || '',
    payout_amount: Number(visitData.payout_amount || 0),
    visit_type: visitData.visit_type || 'Site Visit',
    key_task: visitData.key_task?.trim(),
    status: normalizeStatus(visitData.status),
    signature: visitData.signature || '',
    check_in: visitData.check_in || '',
    check_out: visitData.check_out || '',
  };

  const { data, error } = await supabase
    .from('site_visits')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    status: normalizeStatus(data.status),
  };
}

export async function updateVisit(id, updateData) {
  const { data, error } = await supabase
    .from('site_visits')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { ...data, status: normalizeStatus(data.status) };
}

export async function deleteVisitById(id) {
  const { error } = await supabase.from('site_visits').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ✅ FIXED COMPUTE SUMMARY LOGIC FOR UPPER ICONS
export function computeSummary(visits = []) {
  const rawList = Array.isArray(visits) ? visits : [];
  
  let totalMinutes = 0;
  let totalRevenue = 0;
  let completed = 0;
  let pending = 0;

  rawList.forEach((visit) => {
    if (!visit) return;
    
    // Duration safe parsing to protect against 'undefined' or 'NaN' views
    const duration = visitDurationMinutes(visit);
    totalMinutes += (Number.isNaN(duration) || duration < 0) ? 0 : duration;
    
    // Revenue tracking check supporting both database variants
    const cash = Number(visit.payout_amount || visit.payoutAmount || 0);
    totalRevenue += Number.isNaN(cash) ? 0 : cash;

    if (normalizeStatus(visit.status) === 'completed') {
      completed += 1;
    } else {
      pending += 1;
    }
  });

  const rawHours = totalMinutes / 60;

  return {
    totalVisits: rawList.length,
    totalHours: Number.isNaN(rawHours) ? 0 : Math.round(rawHours * 100) / 100,
    totalMinutes: Number.isNaN(totalMinutes) ? 0 : totalMinutes,
    totalRevenue: Number.isNaN(totalRevenue) ? 0 : totalRevenue,
    completed,
    pending,
  };
}

export function formatDisplayDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDuration(minutes) {
  const mins = Number(minutes) || 0;
  if (mins <= 0) return '0m';

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${remainingMins}m`;
}

export function formatINR(amount) {
  const num = Number(amount);
  if (Number.isNaN(num) || !num) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}