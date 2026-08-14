import React from 'react';
import { useApp } from '../context/AppContext';
import { Clock, DollarSign, Briefcase, CheckCircle2 } from 'lucide-react';

export default function SummaryCards() {
  const { summary, visits } = useApp();

  // Bullet-proof real-time fallback calculations
  const totalVisitsCount = visits?.length || summary?.totalVisits || 0;

  const totalBillingsAmount = visits?.reduce((acc, curr) => {
    const rawVal = curr.payoutAmount ?? curr.payout_amount ?? curr.payout ?? 0;
    const num = Number(rawVal);
    return acc + (isNaN(num) ? 0 : num);
  }, 0) || summary?.totalBillings || summary?.totalPayout || 0;

  const totalHoursLogged = visits?.reduce((acc, curr) => {
    const rawHrs = curr.durationHours ?? curr.duration_hours ?? 0;
    const num = Number(rawHrs);
    return acc + (isNaN(num) ? 0 : num);
  }, 0) || summary?.totalHours || summary?.totalHoursLogged || 0;

  const completedCount = visits?.filter((v) => {
    const st = String(v.status || '').toLowerCase();
    return st === 'completed' || st === 'paid';
  }).length || summary?.paidVisits || 0;

  const metrics = [
    {
      title: 'TOTAL VISITS',
      value: totalVisitsCount,
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'HOURS LOGGED',
      value: `${Number(totalHoursLogged).toFixed(1)} hrs`,
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'TOTAL BILLINGS',
      value: `₹${Number(totalBillingsAmount).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'COMPLETED',
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {item.title}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                {item.value}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
              <IconComponent size={22} />
            </div>
          </div>
        );
      })}
    </div>
  );
}