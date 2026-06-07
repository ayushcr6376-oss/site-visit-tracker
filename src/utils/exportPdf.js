import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDisplayDate, formatDuration, formatINR } from './storage';
import { VISIT_STATUS } from './constants';

export function generateVisitsPdfReport(visits, summary, userName) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const generatedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Industrial Site Visit Tracker', margin, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Site Visits Summary Report', margin, 24);
  doc.text(`Prepared for: ${userName || 'User'}`, margin, 30);

  doc.setTextColor(60, 60, 67);
  doc.setFontSize(9);
  doc.text(`Generated: ${generatedAt}`, pageWidth - margin, 30, { align: 'right' });

  let y = 46;

  doc.setTextColor(30, 58, 138);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, y);
  y += 8;

  const summaryData = [
    ['Total Site Visits', String(summary.totalVisits)],
    ['Total Hours Logged', `${summary.totalHours.toFixed(2)} hrs`],
    ['Total Billing / Revenue', `INR ${summary.totalRevenue}`],
    ['Paid Visits', String(visits.filter((v) => v.status === VISIT_STATUS.PAID).length)],
    ['Pending Visits', String(visits.filter((v) => v.status !== VISIT_STATUS.PAID).length)],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: summaryData,
    margin: { left: margin, right: margin },
    theme: 'plain',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 247],
    },
  });

  y = doc.lastAutoTable.finalY + 12;

  doc.setTextColor(30, 58, 138);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Visit Log Details', margin, y);
  y += 4;

  if (visits.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(134, 134, 139);
    doc.text('No site visits recorded yet.', margin, y + 6);
  } else {
    const tableBody = visits.map((visit, index) => [
      String(index + 1),
      formatDisplayDate(visit.visitDate),
      formatDuration(visit.durationHours, visit.durationMinutes),
      visit.clientCompany,
      visit.parentCompany,
      formatINR`INR ${visit.payoutAmount}`,
      visit.visitType,
      visit.status || VISIT_STATUS.PENDING,
    ]);

    autoTable(doc, {
      startY: y + 2,
      head: [
        [
          '#',
          'Date',
          'Duration',
          'Client',
          'Parent/Vendor',
          'Payout',
          'Type',
          'Status',
        ],
      ],
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: { fillColor: [245, 245, 247] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 16 },
      },
    });

    y = doc.lastAutoTable.finalY + 10;

    const pageHeight = doc.internal.pageSize.getHeight();
    visits.forEach((visit, index) => {
      if (!visit.keyTask && !visit.signature) return;

      const blockHeight = 50;
      if (y + blockHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(`Visit ${index + 1} — Additional Details`, margin, y);
      y += 5;

      if (visit.keyTask) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 67);
        doc.setFontSize(8);
        const taskLines = doc.splitTextToSize(
          `Task: ${visit.keyTask}`,
          pageWidth - margin * 2
        );
        doc.text(taskLines, margin, y);
        y += taskLines.length * 4 + 4;
      }

      if (visit.signature) {
        try {
          const imgWidth = 50;
          const imgHeight = 22;
          if (y + imgHeight > pageHeight - 15) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(8);
          doc.text('Client / Manager Signature:', margin, y);
          y += 4;
          doc.addImage(visit.signature, 'PNG', margin, y, imgWidth, imgHeight);
          y += imgHeight + 8;
        } catch {
          doc.setFontSize(8);
          doc.text('Signature: [unable to render]', margin, y);
          y += 8;
        }
      }
    });
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(134, 134, 139);
    doc.text(
      `Page ${i} of ${totalPages} — Industrial Site Visit Tracker`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`site-visits-report-${dateStamp}.pdf`);
}
