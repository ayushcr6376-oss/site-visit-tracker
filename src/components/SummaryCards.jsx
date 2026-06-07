import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/storage';

function MetricCard({ label, value, sublabel, icon }) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-card border border-white hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-premium-gray-dark uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-3 text-2xl sm:text-3xl font-semibold text-royal-800 tracking-tight truncate">
            {value}
          </p>
          {sublabel && (
            <p className="mt-1.5 text-xs text-premium-gray-dark">{sublabel}</p>
          )}
        </div>
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-royal-50 flex items-center justify-center text-royal-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards() {
  const { summary } = useApp();

  const hoursDisplay =
    summary.totalHours >= 1
      ? `${summary.totalHours.toFixed(1)} hrs`
      : `${summary.totalMinutes} min`;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <MetricCard
        label="Total Site Visits"
        value={summary.totalVisits}
        sublabel="Logged to date"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
      <MetricCard
        label="Total Hours Logged"
        value={hoursDisplay}
        sublabel="On-site duration"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <MetricCard
        label="Total Billing"
        value={formatINR(summary.totalRevenue)}
        sublabel="Revenue earned (INR)"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </section>
  );
}
