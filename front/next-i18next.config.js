import path from 'path';

const nextI18NextConfig = {
  i18n: {
    defaultLocale: 'fr',
    locales: ['en', 'fr'],
  },
  localePath: typeof window === 'undefined'
    ? path.resolve('./public/locales')
    : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};

export default nextI18NextConfig;
