import { formatDisplayDate, formatDuration } from './storage';
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

export function exportVisitsToCsv(visits) {
  const headers = [
    'Visit ID',
    'Date of Visit',
    'Duration',
    'Duration (Minutes)',
    'Client Company',
    'Parent/Vendor Company',
    'Payout (INR)',
    'Visit Type',
    'Status',
    'Key Task Performed',
    'Has Signature',
    'Created At',
  ];

  const rows = visits.map((visit) => {
    const durationLabel = formatDuration(visit.durationHours, visit.durationMinutes);
    const totalMinutes =
      (Number(visit.durationHours) || 0) * 60 + (Number(visit.durationMinutes) || 0);

    return buildCsvRow([
      visit.id,
      formatDisplayDate(visit.visitDate),
      durationLabel,
      totalMinutes,
      visit.clientCompany,
      visit.parentCompany,
      Number(visit.payoutAmount).toFixed(2),
      visit.visitType,
      visit.status || VISIT_STATUS.PENDING,
      visit.keyTask,
      visit.signature ? 'Yes' : 'No',
      visit.createdAt ? new Date(visit.createdAt).toISOString() : '',
    ]);
  });

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
