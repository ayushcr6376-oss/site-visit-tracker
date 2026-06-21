import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/supabaseClient'; // Agar supabase instance alag hai toh useApp ke functions handle karenge

export default function AuthScreen() {
  const { authError, setAuthError } = useApp();
  const [mode, setMode] = useState('login'); // 'login' ya 'signup'
  const [step, setStep] = useState('email'); // 'email' ya 'otp'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStep('email');
    setFieldErrors({});
    setAuthError('');
    setMessage('');
    setEmail('');
    setName('');
    setOtp('');
  };

  const validateEmailStep = () => {
    const errors = {};
    if (mode === 'signup' && name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateOtpStep = () => {
    const errors = {};
    if (!otp.trim() || otp.trim().length !== 6) {
      errors.otp = 'Enter a valid 6-digit OTP.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 1. Send OTP function (Dono Login aur Signup ke liye kaam karega)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setMessage('');
    if (!validateEmailStep()) return;

    setSubmitting(true);
    try {
      // Supabase dynamic OTP trigger
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // Agar naya user hai toh signup metadata mein name save hoga
          data: mode === 'signup' ? { full_name: name.trim() } : {},
          shouldCreateUser: mode === 'signup', // signup mein user banayega, login mein nahi agar nahi mila toh
        },
      });

      if (error) throw error;

      setMessage(`6-Digit OTP has been sent to ${email}`);
      setStep('otp');
    } catch (err) {
      setAuthError(err.message || 'Failed to send OTP. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Verify OTP function
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validateOtpStep()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });

      if (error) throw error;
      // Verification success hote hi Supabase Auth State auto trigger ho jayegi aur app dashboard khul jayega
    } catch (err) {
      setAuthError(err.message || 'Invalid OTP. Please check again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-white via-premium-gray to-premium-gray-mid/40">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-royal-700 shadow-card mb-5">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
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
          {/* Tab switching tabs tab tak dikhenge jab tak step email par hai */}
          {step === 'email' && (
            <div className="flex rounded-xl bg-premium-gray p-1 mb-8">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === 'login' ? 'bg-white text-royal-700 shadow-soft' : 'text-premium-gray-dark hover:text-royal-700'
                }`}
              >
                OTP Login
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === 'signup' ? 'bg-white text-royal-700 shadow-soft' : 'text-premium-gray-dark hover:text-royal-700'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {authError && (
            <div role="alert" className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
              {authError}
            </div>
          )}

          {message && (
            <div role="alert" className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-medium">
              {message}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
              {mode === 'signup' && (
                <div>
                  <label htmlFor="signup-name" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                    Full Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-slate-800 text-sm transition-all focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                      fieldErrors.name ? 'border-red-500' : 'border-transparent'
                    }`}
                    placeholder="Alex Morgan"
                  />
                  {fieldErrors.name && <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldErrors.name}</p>}
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-slate-800 text-sm transition-all focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    fieldErrors.email ? 'border-red-500' : 'border-transparent'
                  }`}
                  placeholder="you@company.com"
                />
                {fieldErrors.email && <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldErrors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 mt-2 rounded-xl bg-royal-700 text-white text-sm font-semibold shadow-soft hover:bg-royal-800 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending OTP…' : 'Get 6-Digit OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
              <div>
                <label htmlFor="auth-otp" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Enter 6-Digit OTP
                </label>
                <input
                  id="auth-otp"
                  type="text"
                  maxLength={6}
                  pattern="\d*"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Sirf numbers allow karega
                  className={`w-full text-center tracking-[0.5em] text-lg font-bold px-4 py-3 rounded-xl border bg-premium-gray/50 text-slate-800 transition-all focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    fieldErrors.otp ? 'border-red-500' : 'border-transparent'
                  }`}
                  placeholder="000000"
                />
                {fieldErrors.otp && <p className="mt-1.5 text-center text-xs text-red-600 font-medium">{fieldErrors.otp}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-soft hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Verifying…' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-center text-xs font-medium text-royal-600 hover:text-royal-700 transition-colors mt-2"
              >
                ← Change Email Address
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-premium-gray-dark mt-8">
          Secure OTP system · No passwords needed
        </p>
      </div>
    </div>
  );
}