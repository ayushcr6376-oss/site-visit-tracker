import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { isAuthenticated, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-premium-gray">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-royal-200 border-t-royal-700 animate-spin"
            role="status"
            aria-label="Loading"
          />
          <p className="text-sm text-premium-gray-dark">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
