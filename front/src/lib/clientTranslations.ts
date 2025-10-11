// Client-side translations cache and loader
// Only intended for browser usage (client components)
const cache = new Map<string, Record<string, any>>();
const inFlight = new Map<string, Promise<Record<string, any>>>();

export async function getTranslations(locale: string): Promise<Record<string, any>> {
  if (!locale) locale = 'fr';
  if (cache.has(locale)) return cache.get(locale)!;
  if (inFlight.has(locale)) return inFlight.get(locale)!;

  const p = fetch(`/locales/${locale}/common.json`)
    .then((res) => {
      if (!res.ok) return {};
      return res.json();
    })
    .then((json) => {
      cache.set(locale, json || {});
      inFlight.delete(locale);
      return cache.get(locale)!;
    })
    .catch((err) => {
      inFlight.delete(locale);
      return {};
    });

  inFlight.set(locale, p);
  return p;
}

export function clearTranslationsCache() {
  cache.clear();
}

export function setTranslationsDirect(locale: string, data: Record<string, any>) {
  cache.set(locale, data);
}
