import {
  formatDisplayDate,
  normalizeStatus,
  stripKeyTaskPrefix,
} from './storage';
import { VISIT_STATUS } from './constants';

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(cells) {
  return cells.map(escapeCsvCell).join(',');
}

function statusLabel(status) {
  return normalizeStatus(status) === VISIT_STATUS.COMPLETED ? 'Completed' : 'Pending';
}

export function exportVisitsToCsv(visits) {
  const headers = [
    'Visit ID',
    'Date of Visit',
    'IN Time',
    'OUT Time',
    'Client Company',
    'Parent/Vendor Company',
    'Payout (INR)',
    'Visit Type',
    'Status',
    'Key Task Performed',
    'Has Signature',
    'Created At',
  ];

  const rows = visits.map((visit) =>
    buildCsvRow([
      visit.id,
      formatDisplayDate(visit.date),
      visit.check_in || '',
      visit.check_out || '',
      visit.site_name,
      visit.parent_company,
      Number(visit.payout_amount || 0).toFixed(2),
      visit.visit_type,
      statusLabel(visit.status),
      stripKeyTaskPrefix(visit.key_task),
      visit.signature ? 'Yes' : 'No',
      visit.created_at ? new Date(visit.created_at).toISOString() : '',
    ])
  );

  const csvContent = [buildCsvRow(headers), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `site-visits-export-${dateStamp}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
