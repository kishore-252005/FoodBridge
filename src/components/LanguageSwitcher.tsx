import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('ta') ? 'en' : 'ta';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 text-sm font-semibold"
      title="Switch Language"
    >
      <Languages className="w-4 h-4" />
      <span>{i18n.language.startsWith('ta') ? 'English' : 'தமிழ்'}</span>
    </button>
  );
}
