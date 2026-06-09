import { VISIT_STATUS } from '../utils/constants';
import {
  formatDisplayDate,
  formatDuration,
  formatINR,
} from '../utils/storage';
import jsPDF from 'jspdf';

export default function VisitCard({ visit, onDelete }) {
  const isPaid = visit.status === VISIT_STATUS.PAID;

  const handleDelete = () => {
    const confirmed = window.confirm(
      'Remove this site visit from your log? This cannot be undone.'
    );
    if (confirmed) {
      onDelete(visit.id);
    }
  };

  // Single PDF Generate karne ka premium function (Matches your exact fields!)
  const handleDownloadSinglePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Top Header Branding Banner
      doc.setFillColor(15, 32, 67); // Royal Dark Blue
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('INDUSTRIAL SITE VISIT REPORT', 15, 25);
      
      // Bottom Footer Line
      doc.setDrawColor(226, 232, Slate = 240);
      doc.line(15, 275, 195, 275);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated via Site Tracker · ${new Date().toLocaleDateString()} · Page 1 of 1`, 15, 282);

      // Report Details Setup
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);

      let currentY = 55;
      const addRow = (label, value) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 15, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value || 'N/A'), 65, currentY);
        currentY += 12;
      };

      addRow('Client Company', visit.clientCompany);
      addRow('Parent Company', visit.parentCompany || 'N/A');
      addRow('Visit Date', visit.visitDate ? formatDisplayDate(visit.visitDate) : 'N/A');
      addRow('Visit Type', visit.visitType || 'N/A');
      addRow('Duration', formatDuration(visit.durationHours, visit.durationMinutes));
      addRow('Status', visit.status || VISIT_STATUS.PENDING);
      addRow('Payout Amount', formatINR(visit.payoutAmount || 0));

      // Key Task Box
      currentY += 5;
      doc.setFillColor(248, 250, 252); // Light Gray Box
      doc.rect(15, currentY, 180, 40, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.text('Key Task Executed:', 20, currentY + 10);
      doc.setFont('helvetica', 'normal');
      
      // Auto-wrap text lines if Key Task is long
      const splitTasks = doc.splitTextToSize(visit.keyTask || 'No tasks logged.', 170);
      doc.text(splitTasks, 20, currentY + 22);

      // Signature Rendering (If available)
      if (visit.signature) {
        currentY += 55;
        doc.setFont('helvetica', 'bold');
        doc.text('Client / Manager Signature:', 15, currentY);
        
        // Adds Base64 image into PDF directly
        doc.addImage(visit.signature, 'PNG', 15, currentY + 5, 50, 22);
      }

      // Download Trigger with Company Name
      const fileName = visit.clientCompany ? visit.clientCompany.replace(/\s+/g, '_') : 'Visit';
      doc.save(`Visit_Report_${fileName}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF. Make sure jsPDF is installed.');
    }
  };

  return (
    <article className="bg-white rounded-2xl p-5 sm:p-6 shadow-card border border-white hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <time
              dateTime={visit.visitDate}
              className="text-sm font-semibold text-royal-800"
            >
              {formatDisplayDate(visit.visitDate)}
            </time>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isPaid
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isPaid ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                aria-hidden
              />
              {visit.status || VISIT_STATUS.PENDING}
            </span>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-royal-50 text-royal-700">
              {visit.visitType}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-800 truncate">
            {visit.clientCompany}
          </h3>
          <p className="text-sm text-premium-gray-dark truncate">
            {visit.parentCompany}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Mast Naya Single PDF Button */}
          <button
            type="button"
            onClick={handleDownloadSinglePDF}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-royal-700 bg-royal-50 hover:bg-royal-100 opacity-80 group-hover:opacity-100 transition-all duration-200"
            title="Download Single PDF Report"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-premium-gray-dark hover:text-red-600 hover:bg-red-50 opacity-70 group-hover:opacity-100 transition-all duration-200"
            aria-label="Delete visit"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-premium-gray-mid/40">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-premium-gray-dark font-medium">
            Duration
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {formatDuration(visit.durationHours, visit.durationMinutes)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-premium-gray-dark font-medium">
            Payout
          </p>
          <p className="mt-1 text-sm font-medium text-royal-700">
            {formatINR(visit.payoutAmount)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-2">
          <p className="text-[10px] uppercase tracking-wider text-premium-gray-dark font-medium">
            Key Task
          </p>
          <p className="mt-1 text-sm text-slate-700 line-clamp-2">{visit.keyTask}</p>
        </div>
      </div>

      {visit.signature && (
        <div className="mt-4 pt-4">
          <p className="text-[10px] uppercase tracking-wider text-premium-gray-dark font-medium mb-2">
            Client / Manager Signature
          </p>
          <div className="inline-block p-3 rounded-xl bg-premium-gray/50 border border-premium-gray-mid/60">
            <img
              src={visit.signature}
              alt={`Signature for visit on ${formatDisplayDate(visit.visitDate)}`}
              className="h-16 sm:h-20 max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </article>
  );
}
