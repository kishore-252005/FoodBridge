import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Heart, 
  MapPin, 
  LogOut, 
  Edit3, 
  Save, 
  X,
  Loader,
  AlertCircle,
  CheckCircle2,
  Building,
  Truck,
  ShieldAlert
} from 'lucide-react';

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Edit form states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [area, setArea] = useState(user?.area || '');

  // Operation flags
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8 min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Revert states
      setFullName(user.fullName);
      setPhone(user.phone);
      setCity(user.city);
      setArea(user.area);
    }
    setError('');
    setSuccess('');
    setIsEditing(!isEditing);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // --- Validate Fields ---
    if (!fullName.trim() || !phone.trim() || !city.trim() || !area.trim()) {
      setError(t('profile.errorEmpty'));
      return;
    }

    setLoading(true);
    try {
      await updateProfile(fullName.trim(), phone.trim(), city.trim(), area.trim());
      setSuccess(t('profile.successUpdate'));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || t('profile.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-8" id="profile-page-container">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Profile Card Banner - Pristine Light Corporate layout */}
        <div className="p-8 bg-white border-b border-gray-100 relative">
          <div className="flex flex-col md:flex-row items-center gap-6">
            
            {/* Avatar Capsule */}
            <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 text-3xl font-black text-emerald-600 flex items-center justify-center shadow-sm">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            
            <div className="text-center md:text-left space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{user.fullName}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-slate-500">
                <span className="font-mono text-slate-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">{user.email}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className="bg-gray-50 text-emerald-800 border border-emerald-100 px-3 py-0.5 rounded-full flex items-center gap-1.5 font-bold text-[10px] uppercase font-mono">
                  {user.role === 'Donor' && <Heart className="w-3.5 h-3.5 text-emerald-500" />}
                  {user.role === 'NGO' && <Building className="w-3.5 h-3.5 text-blue-500" />}
                  {user.role === 'Volunteer' && <Truck className="w-3.5 h-3.5 text-amber-500" />}
                  {user.role === 'Admin' && <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />}
                  {user.role}
                </span>
              </div>
            </div>

            {/* Float Toggler */}
            <button
              id="edit-profile-toggle"
              onClick={handleEditToggle}
              className="md:absolute md:top-8 md:right-8 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer text-slate-500"
              title={t('profile.editProfile')}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </button>
            
          </div>
        </div>

        {/* Alerts and Notifiers */}
        {error && (
          <div className="m-6 p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-2xl flex items-start gap-3 text-xs animate-fade-in animate-once duration-300" id="profile-error">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs animate-fade-in" id="profile-success">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {/* Information Fields Content */}
        <div className="p-8">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-5" id="profile-edit-form">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 border-b border-gray-100 pb-3 font-mono">{t('profile.editTitle')}</h3>
              
              {/* Full Name field */}
              <div>
                <label className="block text-2xs font-bold uppercase text-slate-500 mb-1.5">{t('profile.fullName')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="edit-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Phone field */}
              <div>
                <label className="block text-2xs font-bold uppercase text-slate-500 mb-1.5">{t('profile.mobilePhone')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    id="edit-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* City field */}
                <div>
                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1.5">{t('profile.city')}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      id="edit-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Area field */}
                <div>
                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1.5">{t('profile.area')}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      id="edit-area"
                      type="text"
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  id="btn-save-profile"
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer disabled:bg-emerald-400"
                >
                  {loading ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('profile.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{t('profile.saveChanges')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {t('profile.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6" id="profile-view-details">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 border-b border-gray-100 pb-3 font-mono">{t('profile.infoTitle')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Email (Readonly) */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px] mb-0.5 font-mono">{t('profile.email')}</span>
                    <span className="font-semibold text-slate-800">{user.email}</span>
                  </div>
                </div>

                {/* Phone (Read/Write) */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px] mb-0.5 font-mono">{t('profile.mobilePhone')}</span>
                    <span className="font-mono text-slate-805 font-bold">{user.phone || t('profile.notSpecified')}</span>
                  </div>
                </div>

                {/* City Region */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px] mb-0.5 font-mono">{t('profile.operatingCity')}</span>
                    <span className="font-semibold text-slate-800">{user.city || t('profile.notSpecified')}</span>
                  </div>
                </div>

                {/* Specific Area */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[10px] mb-0.5 font-mono">{t('profile.neighborhood')}</span>
                    <span className="font-semibold text-slate-800">{user.area || t('profile.notSpecified')}</span>
                  </div>
                </div>

                {/* Created Date */}
                <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">{t('profile.createdDate')}</span>
                  <span className="text-2xs text-slate-500 font-mono block mt-1">
                    {new Date(user.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Logout Block */}
              <div className="pt-8 border-t border-gray-150 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block uppercase font-mono">{t('profile.endSession')}</span>
                  <span className="text-2xs text-slate-400 block mt-0.5">{t('profile.logoutSub')}</span>
                </div>
                <button
                  id="btn-logout-inside-profile"
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors border border-rose-100 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('profile.logoutBtn')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
