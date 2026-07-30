import React, { useState } from 'react';
import ActionArea from './ActionArea';
import Header from './Header';
import SettingsView from './SettingsView';
import SummaryCards from './SummaryCards';
import VisitHistory from './VisitHistory';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' or 'settings'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header ko activeTab aur state changer pass kar rahe hain */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">
        {activeTab === 'home' ? (
          <>
            <SummaryCards />
            <ActionArea />
            <VisitHistory />
          </>
        ) : (
          <SettingsView setActiveTab={setActiveTab} />
        )}
      </main>

      <footer className="py-6 text-center text-xs text-premium-gray-dark">
        Industrial Site Visit Tracker · Cloud sync via Supabase
      </footer>
    </div>
  );
}