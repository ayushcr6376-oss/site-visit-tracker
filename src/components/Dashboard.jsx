import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import VisitCard from './VisitCard';
import VisitModal from './VisitModal';
import SettingView from './SettingView';
import { Briefcase, Clock, DollarSign, CheckCircle2, Plus, Search, Settings, User, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { summary, visits, filteredVisits, searchQuery, setSearchQuery, deleteVisit, user, userProfile } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const displayList = filteredVisits || visits || [];
  const displayName = userProfile?.fullName || user?.name || user?.email?.split('@')[0] || 'Engineer';
  const designation = userProfile?.designation || 'Site Specialist';
  const isBusiness = userProfile?.appMode === 'business';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 1. Header Profile & Settings Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg overflow-hidden shadow-sm">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={24} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">{displayName}</h1>
              {isBusiness && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> Business Mode
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Briefcase size={12} className="text-blue-500" />
              {designation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            title="Settings & Modes"
          >
            <Settings size={16} />
            Settings
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all whitespace-nowrap"
          >
            <Plus size={16} />
            Log New Visit
          </button>
        </div>
      </div>

      {/* 2. Top Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
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

      {/* 3. Action Controls & Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Past Visits</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {displayList.length} records logged
          </p>
        </div>

        <div className="relative flex-1 sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search site, client, task..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>
      </div>

      {/* 4. Visit Cards List */}
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

      {/* 5. Modals */}
      <VisitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <SettingView isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}