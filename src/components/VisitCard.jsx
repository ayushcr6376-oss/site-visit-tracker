import React from 'react';
import { Clock, DollarSign, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

export default function VisitCard({ visit, onDelete }) {
  // Safe Fallbacks for Displaying Values
  const siteName = visit.clientCompany || visit.site_name || visit.client_company || 'Industrial Site';
  const parentComp = visit.parentCompany || visit.parent_company || visit.manager_name || '';
  const dateStr = visit.visitDate || visit.visit_date || (visit.createdAt ? visit.createdAt.split('T')[0] : 'N/A');
  
  // Times & Duration
  const inTime = visit.inTime || visit.check_in || visit.in_time || '—';
  const outTime = visit.outTime || visit.check_out || visit.out_time || '—';
  
  // Task & Payout
  const keyTask = visit.keyTask || visit.key_task || visit.purpose || 'No tasks logged.';
  const payout = Number(visit.payoutAmount || visit.payout_amount || 0);
  const status = visit.status || 'PAID';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4 hover:shadow-md transition-shadow">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800">{siteName}</h3>
            {parentComp && <span className="text-sm text-slate-500">({parentComp})</span>}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              • {status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
        </div>

        {onDelete && (
          <button 
            onClick={() => onDelete(visit.id)} 
            className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors"
            title="Delete Visit"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Main Details Grid */}
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

      {/* Signature Preview */}
      {visit.signature && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Client / Manager Signature</p>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 inline-block">
            <img src={visit.signature} alt="Signature" className="h-12 object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}