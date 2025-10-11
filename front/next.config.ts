import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    // These are all the locales you want to support in
    // your application
    locales: ['en', 'fr',],
    defaultLocale: 'fr',
  },
  output: 'standalone',
  // Ensure Next infers the correct workspace root (avoids picking up a parent lockfile)
};

export default nextConfig;
