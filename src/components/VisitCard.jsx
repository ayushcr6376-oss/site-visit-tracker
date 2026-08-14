import React from 'react';
import { Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';

export default function VisitCard({ visit, onDelete }) {
  const siteName = visit.clientCompany || visit.site_name || 'Industrial Site';
  const parentComp = visit.parentCompany || visit.parent_company || '';
  const dateStr = visit.visitDate || visit.visit_date || (visit.createdAt ? visit.createdAt.split('T')[0] : 'N/A');
  
  const inTime = visit.inTime || visit.check_in || '—';
  const outTime = visit.outTime || visit.check_out || '—';
  const keyTask = visit.keyTask || visit.key_task || 'No tasks logged.';
  const payout = Number(visit.payoutAmount || visit.payout_amount || 0);
  const status = visit.status || 'pending';

  const handleDownloadSinglePDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 32, 67);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('INDUSTRIAL SITE VISIT REPORT', 15, 25);

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

      addRow('Site Name / Company', siteName);
      if (parentComp) addRow('Parent Company', parentComp);
      addRow('Visit Date', dateStr);
      addRow('Status', status.toUpperCase());
      addRow('IN Time', inTime);
      addRow('OUT Time', outTime);
      addRow('Payout Amount', `INR ${payout.toLocaleString('en-IN')}`);

      currentY += 5;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY, 180, 40, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Key Task Executed:', 20, currentY + 10);
      doc.setFont('helvetica', 'normal');
      const splitTasks = doc.splitTextToSize(keyTask, 170);
      doc.text(splitTasks, 20, currentY + 22);

      if (visit.signature) {
        currentY += 50;
        doc.setFont('helvetica', 'bold');
        doc.text('Client / Manager Signature:', 15, currentY);
        doc.addImage(visit.signature, 'PNG', 15, currentY + 5, 50, 22);
      }

      doc.save(`Visit_Report_${siteName.replace(/\s+/g, '_')}_${dateStr}.pdf`);
    } catch (err) {
      console.error('Error generating single PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800">{siteName}</h3>
            {parentComp && <span className="text-sm text-slate-500">({parentComp})</span>}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status.toLowerCase() === 'completed' || status.toLowerCase() === 'paid'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              • {status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleDownloadSinglePDF} 
            className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Download Separate PDF Report"
          >
            <Download size={16} />
          </button>

          {onDelete && (
            <button 
              type="button"
              onClick={() => onDelete(visit.id)} 
              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors"
              title="Delete Visit"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase">IN TIME</p>
          <p className="font-medium text-slate-700 mt-0.5">{inTime}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase">OUT TIME</p>
          <p className="font-medium text-slate-700 mt-0.5">{outTime}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase">PAYOUT</p>
          <p className="font-bold text-slate-800 mt-0.5">₹{payout}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase">KEY TASK</p>
          <p className="font-medium text-slate-700 mt-0.5 line-clamp-1">{keyTask}</p>
        </div>
      </div>

      {visit.signature && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">CLIENT / MANAGER SIGNATURE</p>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 inline-block">
            <img src={visit.signature} alt="Signature" className="h-12 object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}