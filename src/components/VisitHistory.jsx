import { useApp } from '../context/AppContext';
import VisitCard from './VisitCard';

export default function VisitHistory() {
  const { filteredVisits, searchQuery, deleteVisit } = useApp();

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-royal-800 tracking-tight">
            Past Visits
          </h2>
          <p className="text-sm text-premium-gray-dark mt-0.5">
            {filteredVisits.length} record{filteredVisits.length !== 1 ? 's' : ''}
            {searchQuery.trim() ? ' matching your search' : ' in your log'}
          </p>
        </div>
      </div>

      {filteredVisits.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 sm:p-16 text-center shadow-card border border-white">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-royal-50 flex items-center justify-center text-royal-600 mb-5">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {searchQuery.trim() ? 'No matching visits' : 'No visits logged yet'}
          </h3>
          <p className="mt-2 text-sm text-premium-gray-dark max-w-sm mx-auto">
            {searchQuery.trim()
              ? 'Try a different search term or clear the search bar.'
              : 'Tap “Log New Visit” to record your first industrial site visit.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {filteredVisits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} onDelete={deleteVisit} />
          ))}
        </div>
      )}
    </section>
  );
}
