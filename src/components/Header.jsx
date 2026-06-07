import { useApp } from '../context/AppContext';

export default function Header() {
  const { user, logout } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-premium-gray-mid/60 shadow-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.25rem]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-royal-700 flex items-center justify-center shadow-soft">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 21h18M5 21V9l7-5 7 5v12"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-royal-800 truncate tracking-tight">
                Industrial Site Visit Tracker
              </h1>
              <p className="text-xs text-premium-gray-dark hidden sm:block">
                Field operations dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-premium-gray-dark">Signed in as</p>
              <p className="text-sm font-medium text-slate-800 truncate max-w-[140px] sm:max-w-[200px]">
                {user?.name || 'User'}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-royal-700 bg-royal-50 rounded-xl hover:bg-royal-100 border border-royal-100 transition-all duration-200 active:scale-[0.98]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
