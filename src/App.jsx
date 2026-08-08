"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppProvider, useApp } from './context/AppContext';
import { supabase } from './supabase';

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
  const { user } = useApp();
  const [sessionUser, setSessionUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user || user || null);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, [user]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  const activeUser = user || sessionUser;

  return (
    <>
      <LanguageSwitcher />
      {!activeUser ? <AuthScreen /> : <Dashboard />}
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