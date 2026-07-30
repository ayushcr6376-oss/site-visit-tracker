import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function Header({ activeTab, setActiveTab }) {
  const { t, i18n } = useTranslation();
  const { user } = useApp();

  const isHindi = i18n.language && i18n.language.startsWith('hi');

  // Supabase Metadata se profile picture nikalo
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.avatar_url ||
    'https://via.placeholder.com/150?text=User';

  return (
    <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
      {/* Brand Title */}
      <h1 className="text-xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
        🏗️ {t('app_title') || 'Industrial Site Tracker'}
      </h1>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3">
        {/* Home Button */}
        <button
          onClick={() => setActiveTab('home')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'home'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          📊 {isHindi ? 'होम' : 'Home'}
        </button>

        {/* Settings & Profile Button */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-6 h-6 rounded-full object-cover border border-slate-400"
          />
          ⚙️ {isHindi ? 'खाता / सेटिंग्स' : 'Settings'}
        </button>
      </div>
    </header>
  );
}