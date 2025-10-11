"use client";
import { useEffect, useState } from 'react';
import i18next from 'i18next';

// Lightweight language switcher that uses Next.js locale routing (route prefixes)
// while keeping a best-effort compatibility with the existing i18next setup.
export function LanguageSwitcher() {
  const [value, setValue] = useState(() => {
    try {
      return (typeof window !== 'undefined' && localStorage.getItem('lang')) || (i18next?.language ?? 'fr');
    } catch {
      return i18next?.language ?? 'fr';
    }
  });

  // Keep i18next in sync when available (non-breaking). If you fully migrate to
  // Next's localization you can remove this.
  useEffect(() => {
    if (i18next && i18next.isInitialized && i18next.changeLanguage && value && i18next.language !== value) {
      try {
        i18next.changeLanguage(value);
      } catch {
        // ignore
      }
    }
  }, [value]);

  const locales = ['fr', 'en'];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setValue(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
      // Inform other components (and tabs) the locale changed
      try {
        window.dispatchEvent(new CustomEvent('localeChanged', { detail: lang }));
      } catch {
        // fallback: use storage event by updating a dedicated key
        localStorage.setItem('lang_changed_at', Date.now().toString());
      }
    }
  };

  return (
    <select value={value} onChange={handleChange}>
      {locales.map(lang => <option key={lang} value={lang}>{lang.toUpperCase()}</option>)}
    </select>
  );
}
