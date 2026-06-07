import { VISIT_STATUS } from '../utils/constants';
import {
  formatDisplayDate,
  formatDuration,
  formatINR,
} from '../utils/storage';

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

        <button
          type="button"
          onClick={handleDelete}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-premium-gray-dark hover:text-red-600 hover:bg-red-50 opacity-70 group-hover:opacity-100 transition-all duration-200"
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
