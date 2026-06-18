import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Heart, User, Mail, Phone, Lock, ListFilter, AlertCircle, Loader, MapPin } from 'lucide-react';
import { UserRole } from '../types';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Donor');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Validation Rules ---
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword || !city.trim() || !area.trim()) {
      setError('Please fill in all the required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid email structure.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await register(
        fullName.trim(),
        email.trim(),
        phone.trim(),
        password,
        role,
        city.trim(),
        area.trim()
      );
      // Automatically redirect to home dashboard depending on role
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Unable to register profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" id="register-container">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-600 p-3 h-12 w-12 rounded-xl mb-3">
            <Heart className="w-6 h-6 fill-emerald-500 stroke-emerald-600" />
          </div>
          <h1 className="text-xl font-sans font-bold text-slate-900 tracking-tight">{t('register.title')}</h1>
          <p className="text-xs text-slate-500 mt-1">{t('register.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start gap-3 text-xs animate-fade-in" id="register-error-alert">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">{t('register.fullName')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  id="reg-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('register.fullNamePlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">{t('auth.emailLabel')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mobile Number */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">{t('register.phone')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('register.phonePlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">{t('register.role')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <ListFilter className="w-3.5 h-3.5" />
                </span>
                <select
                  id="reg-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 cursor-pointer focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  disabled={loading}
                >
                  <option value="Donor">{t('register.donorOpt')}</option>
                  <option value="NGO">{t('register.ngoOpt')}</option>
                  <option value="Volunteer">{t('register.volunteerOpt')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">{t('register.city')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                </span>
                <input
                  id="reg-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('register.cityPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Area */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">{t('register.area')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                </span>
                <input
                  id="reg-area"
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder={t('register.areaPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">{t('register.password')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register.passwordSub')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">{t('register.confirmPassword')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  id="reg-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <button
            id="register-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader className="w-3.5 h-3.5 animate-spin" />
                <span>{t('register.registering')}</span>
              </>
            ) : (
              <span>{t('register.registerBtn')}</span>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs text-slate-500">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
