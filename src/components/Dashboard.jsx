import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import VisitCard from './VisitCard';
import VisitModal from './VisitModal';
import { Briefcase, Clock, DollarSign, CheckCircle2, Plus, Search } from 'lucide-react';

export default function Dashboard() {
  const { summary, visits, filteredVisits, searchQuery, setSearchQuery, deleteVisit } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayList = filteredVisits || visits || [];

  const metrics = [
    {
      title: 'TOTAL VISITS',
      value: summary?.totalVisits || displayList.length || 0,
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'HOURS LOGGED',
      value: `${summary?.totalHours || 0} hrs`,
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'TOTAL BILLINGS',
      value: `₹${Number(summary?.totalBillings || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'COMPLETED',
      value: summary?.paidVisits || 0,
      icon: CheckCircle2,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Top Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* 2. Action Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Past Visits</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {displayList.length} records in your log
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search site, client..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Log New Visit Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all whitespace-nowrap"
          >
            <Plus size={18} />
            Log New Visit
          </button>
        </div>
      </div>

      {/* 3. Visit Cards List */}
      {displayList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500 font-medium">No visits logged yet.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-3 text-blue-600 font-bold text-sm hover:underline"
          >
            + Log your first visit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayList.map((visit) => (
            <VisitCard key={visit.id} visit={visit} onDelete={deleteVisit} />
          ))}
        </div>
      )}

      {/* 4. Modal Popup */}
      <VisitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}