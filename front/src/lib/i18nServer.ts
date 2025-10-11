// Utility to load locale JSON dictionaries from public/locales
// Usage example in server components: const dict = await loadLocale('fr')
import fs from 'fs';
import path from 'path';

export async function loadLocale(locale: string) {
  const p = path.resolve(process.cwd(), 'public', 'locales', locale, 'common.json');
  try {
    const content = await fs.promises.readFile(p, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    // Return empty object on failure so callers can fallback
    return {};
  }
}

export const SUPPORTED_LOCALES = ['fr', 'en'];
export const DEFAULT_LOCALE = 'fr';
