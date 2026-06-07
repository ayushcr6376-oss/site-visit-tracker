import { useState } from 'react';
import { useApp } from '../context/AppContext';

const INITIAL_LOGIN = { email: '', password: '' };
const INITIAL_SIGNUP = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function AuthScreen() {
  const { login, signup, authError, setAuthError } = useApp();
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN);
  const [signupForm, setSignupForm] = useState(INITIAL_SIGNUP);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFieldErrors({});
    setAuthError('');
    setLoginForm(INITIAL_LOGIN);
    setSignupForm(INITIAL_SIGNUP);
  };

  const validateLoginForm = () => {
    const errors = {};
    if (!loginForm.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!loginForm.password) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignupForm = () => {
    const errors = {};
    if (signupForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }
    if (!signupForm.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (signupForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validateLoginForm()) return;
    setSubmitting(true);
    const success = login(loginForm.email, loginForm.password);
    setSubmitting(false);
    if (success) {
      setLoginForm(INITIAL_LOGIN);
      setFieldErrors({});
    }
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validateSignupForm()) return;
    setSubmitting(true);
    const success = signup(
      signupForm.name,
      signupForm.email,
      signupForm.password,
      signupForm.confirmPassword
    );
    setSubmitting(false);
    if (success) {
      setSignupForm(INITIAL_SIGNUP);
      setFieldErrors({});
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-white via-premium-gray to-premium-gray-mid/40">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-royal-700 shadow-card mb-5">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-royal-800 tracking-tight">
            Site Visit Tracker
          </h1>
          <p className="mt-2 text-sm text-premium-gray-dark">
            Industrial field operations, elegantly managed
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-card border border-white/80 p-8 sm:p-10 transition-all duration-300">
          <div className="flex rounded-xl bg-premium-gray p-1 mb-8">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-royal-700 shadow-soft'
                  : 'text-premium-gray-dark hover:text-royal-700'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-white text-royal-700 shadow-soft'
                  : 'text-premium-gray-dark hover:text-royal-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {authError && (
            <div
              role="alert"
              className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm"
            >
              {authError}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-slate-800 text-sm transition-all duration-200 focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    fieldErrors.email ? 'border-red-300' : 'border-transparent'
                  }`}
                  placeholder="you@company.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-slate-800 text-sm transition-all duration-200 focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    fieldErrors.password ? 'border-red-300' : 'border-transparent'
                  }`}
                  placeholder="••••••••"
                />
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 mt-2 rounded-xl bg-royal-700 text-white text-sm font-semibold shadow-soft hover:bg-royal-800 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={signupForm.name}
                  onChange={(e) =>
                    setSignupForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-slate-800 text-sm transition-all duration-200 focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    fieldErrors.name ? 'border-red-300' : 'border-transparent'
                  }`}
                  placeholder="Alex Morgan"
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
                >
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={signupForm.email}
                  onChange={(e) =>
                    setSignupForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-slate-800 text-sm transition-all duration-200 focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    fieldErrors.email ? 'border-red-300' : 'border-transparent'
                  }`}
                  placeholder="you@company.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={signupForm.password}
                  onChange={(e) =>
                    setSignupForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-slate-800 text-sm transition-all duration-200 focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    fieldErrors.password ? 'border-red-300' : 'border-transparent'
                  }`}
                  placeholder="Min. 6 characters"
                />
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signup-confirm"
                  className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="signup-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={signupForm.confirmPassword}
                  onChange={(e) =>
                    setSignupForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-slate-800 text-sm transition-all duration-200 focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    fieldErrors.confirmPassword
                      ? 'border-red-300'
                      : 'border-transparent'
                  }`}
                  placeholder="Repeat password"
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 mt-2 rounded-xl bg-royal-700 text-white text-sm font-semibold shadow-soft hover:bg-royal-800 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-premium-gray-dark mt-8">
          Secure local session · Data stored in your browser
        </p>
      </div>
    </div>
  );
}
