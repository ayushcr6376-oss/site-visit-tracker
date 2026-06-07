import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportVisitsToCsv } from '../utils/exportExcel';
import { generateVisitsPdfReport } from '../utils/exportPdf';
import VisitModal from './VisitModal';

export default function ActionArea() {
  const { visits, user, summary, searchQuery, setSearchQuery } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const showToast = (message) => {
    setExportMessage(message);
    window.setTimeout(() => setExportMessage(''), 3500);
  };

  const handleExportCsv = () => {
    if (visits.length === 0) {
      showToast('No visits to export. Log a visit first.');
      return;
    }
    exportVisitsToCsv(visits);
    showToast(`Exported ${visits.length} visit(s) to CSV.`);
  };

  const handleExportPdf = () => {
    generateVisitsPdfReport(visits, summary, user?.name);
    showToast(
      visits.length === 0
        ? 'PDF report generated (empty log).'
        : `PDF report generated for ${visits.length} visit(s).`
    );
  };

  return (
    <>
      <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-card border border-white">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-royal-700 text-white text-sm font-semibold shadow-soft hover:bg-royal-800 transition-all duration-200 active:scale-[0.99]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Log New Visit
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-royal-700 text-sm font-semibold border border-royal-200 hover:bg-royal-50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export to Excel (.csv)
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-royal-700 text-sm font-semibold border border-royal-200 hover:bg-royal-50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Generate PDF Report
            </button>
          </div>

          <div className="relative w-full lg:max-w-xs flex-shrink-0">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-gray-dark pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search visits…"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-premium-gray/80 border border-transparent text-sm text-slate-800 placeholder:text-premium-gray-dark focus:bg-white focus:border-royal-300 focus:ring-2 focus:ring-royal-100 transition-all duration-200"
              aria-label="Search past visits"
            />
          </div>
        </div>

        {exportMessage && (
          <p
            role="status"
            className="mt-4 text-sm text-royal-700 bg-royal-50 px-4 py-2.5 rounded-xl border border-royal-100"
          >
            {exportMessage}
          </p>
        )}
      </section>

      <VisitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
