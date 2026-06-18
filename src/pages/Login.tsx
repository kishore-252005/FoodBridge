import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Heart, Lock, Mail, AlertCircle, Loader } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Validation Rules ---
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isSpecialAdmin = email.trim().toLowerCase() === 'kishore25';
    if (!isSpecialAdmin && !emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      // Success - Redirect based on routing state or default
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Credentials invalid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" id="login-container">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        
        {/* Platform Identity */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-600 p-3.5 rounded-2xl mb-4">
            <Heart className="w-8 h-8 fill-emerald-500 stroke-emerald-600" />
          </div>
          <h1 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">FoodBridge</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('auth.subtitle')}</p>
        </div>

        {/* Global Action Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start gap-3 text-sm animate-fade-in" id="login-error-alert">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">{t('auth.emailLabel')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">{t('auth.passwordLabel')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all disabled:bg-emerald-450 selection:disabled:cursor-wait"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>{t('auth.loggingIn')}</span>
              </>
            ) : (
              <span>{t('auth.login')}</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
