"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getTranslations } from '../../lib/clientTranslations';
import { useProxy } from '../../lib/hooks/useProxy';

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);

  const { data: proxyData, loading: proxyLoading, callProxy } = useProxy();

  const callProxyRequests = () => {
    callProxy({
      req1: { route: "http://localhost:8000/api/hello-world", method: "GET" },
      req2: { route: "http://localhost:8000/api/hello-world", method: "GET" },
    });
  };

  // use pathname from global location (client) to detect locale
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const getPreferredLocale = (p?: string | null) => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
      if (stored === 'en' || stored === 'fr') return stored;
    } catch {}
    if (!p) return 'fr';
    const parts = p.split('/');
    const candidate = parts[1];
    if (candidate === 'en' || candidate === 'fr') return candidate;
    return 'fr';
  };

  const [locale, setLocale] = typeof window !== 'undefined' ? useState(() => getPreferredLocale(pathname)) : useState('fr');

  useEffect(() => {
    let mounted = true;
    const load = async (loc: string) => {
      const json = await getTranslations(loc);
      if (mounted) setTranslations(json);
    };
  load(locale);

    const onLocaleChanged = (e: any) => {
      const newLoc = e?.detail ?? (typeof window !== 'undefined' ? localStorage.getItem('lang') : null);
      if (newLoc) setLocale(newLoc);
    };

    window.addEventListener('localeChanged', onLocaleChanged as EventListener);
    const onStorage = () => onLocaleChanged(null);
    window.addEventListener('storage', onStorage);

    return () => {
      mounted = false;
      window.removeEventListener('localeChanged', onLocaleChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [locale, pathname]);

  // Redirige vers /dashboard si connecté
  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  const t = (key: string, params?: Record<string, any>) => {
    if (!translations) return key;
    const parts = key.split('.');
    let cur: any = translations;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else return key;
    }
    if (typeof cur === 'string') {
      if (params) {
        return cur.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => params[k] ?? '');
      }
      return cur;
    }
    return key;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-sm text-center">
        {!session ? (
          <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">{t('login.sign_in_keycloak')}</h1>
            <button
              onClick={() => signIn("keycloak")}
              className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition mb-4"
            >
              {t('login.sign_in_keycloak')}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
              {t('login.welcome_user', { name: session.user?.name })}
            </h1>
            <button
              onClick={() => signOut()}
              className="w-full mb-4 py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
            >
              {t('login.sign_out')}
            </button>
          </>
        )}

        {/* Bouton pour appeler le proxy */}
        <button
          onClick={callProxyRequests}
          className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
        >
          {session ? t('login.call_gateway_with_token') : t('login.call_gateway_without_token')}
        </button>

        {proxyLoading && <p className="mt-4">Chargement...</p>}
        {proxyData && (
          <div className="mt-4 text-left bg-gray-100 text-black p-4 rounded text-sm overflow-auto max-h-64">
            {Object.entries(proxyData).map(([key, value]) => (
              <div key={key} className="mb-2">
                <strong>{key}:</strong>
                <pre>{JSON.stringify(value, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
