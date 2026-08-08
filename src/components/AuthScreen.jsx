import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function AuthScreen() {
  const { i18n } = useTranslation();
  const { login, signup, authError, setAuthError } = useApp();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHindi = i18n.language && i18n.language.startsWith('hi');

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setAuthError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setAuthError('');

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (isSignUp) {
        await signup(name.trim(), cleanEmail, password, confirmPassword);
      } else {
        await login(cleanEmail, password);
      }
    } catch (err) {
      console.error("Form Submit Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            {isSignUp
              ? isHindi ? 'नया खाता बनाएं' : 'Create an Account'
              : isHindi ? 'साइन इन करें' : 'Sign In'}
          </h1>
          <p className="text-sm text-slate-500">
            {isSignUp
              ? isHindi ? 'साइट विजिट ट्रैकर में आपका स्वागत है' : 'Enter your details to register'
              : isHindi ? 'अपने खाते में प्रवेश करें' : 'Enter your email & password to sign in'}
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 text-center font-medium">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isHindi ? 'पूरा नाम' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isHindi ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isHindi ? 'ईमेल' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isHindi ? 'पासवर्ड' : 'Password'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isHindi ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm shadow transition-all cursor-pointer"
          >
            {isSubmitting
              ? isHindi ? 'कृपया प्रतीक्षा करें...' : 'Please wait...'
              : isSignUp
              ? isHindi ? 'अकाउंट बनाएं' : 'Sign Up'
              : isHindi ? 'साइन इन करें' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t">
          <p className="text-xs text-slate-600">
            {isSignUp ? (
              <>
                {isHindi ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  {isHindi ? 'साइन इन करें' : 'Sign In'}
                </button>
              </>
            ) : (
              <>
                {isHindi ? 'नया खाता बनाना चाहते हैं?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  {isHindi ? 'साइन अप करें (Create Account)' : 'Sign Up'}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}