"use client";
import i18next from 'i18next';
import { useEffect } from 'react';

export function LanguageSwitcher() {
  // Defensive: Only call changeLanguage if i18next is initialized and has the method
  const i18n = i18next;

  useEffect(() => {
    const lang = typeof window !== 'undefined' ? (localStorage.getItem('lang') || navigator.language.split('-')[0]) : 'fr';
    if (
      i18n.language !== lang &&
      ['en', 'fr'].includes(lang) &&
      typeof i18n.changeLanguage === 'function' &&
      i18n.isInitialized
    ) {
      i18n.changeLanguage(lang);
    }
  }, [i18n]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    if (typeof i18n.changeLanguage === 'function' && i18n.isInitialized) {
      i18n.changeLanguage(lang);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
    }
  };

  return (
    <select value={i18n.language} onChange={handleChange}>
      <option value="fr">Français</option>
      <option value="en">English</option>
    </select>
  );
}
