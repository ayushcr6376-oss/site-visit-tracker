"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppProvider, useApp } from './context/AppContext';

// Clean and safe imports for Vercel
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const isHindi = i18n.language && i18n.language.startsWith('hi');

  const toggleLanguage = () => {
    i18n.changeLanguage(isHindi ? 'en' : 'hi');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
    >
      <span>🌐</span>
      <span>{isHindi ? 'English' : 'हिंदी'}</span>
    </button>
  );
}

function AppContent() {
  const { isAuthenticated, authLoading } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  // Hydration errors se bachne ke liye
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" role="status" aria-label="Loading" />
          <p className="text-sm text-slate-500">Loading session…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LanguageSwitcher />
      {!isAuthenticated ? <AuthScreen /> : <Dashboard />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}