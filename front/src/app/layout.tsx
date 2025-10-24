import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Roboto } from "next/font/google";
import "./globals.css";

import { LanguageSwitcher } from "./components/LanguageSwitcher";
import SessionClientProvider from "./providers/SessionClientProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";
import ToastContainer from "./components/ToastContainer";
import { ToastProvider } from "@/lib/hooks/useToast";
import ThemeModeProvider from "./providers/ThemeModeProvider";

// Charger la font Roboto via next/font
const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Flotio",
  description: "Deploy and manage your projects easily",
   icons: {
    icon: "/ico.jpg",
  },
};

export default async function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
  const session = (await getServerSession(authOptions as any)) as Session | null;

  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body>
        <SessionClientProvider session={session}>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <ThemeModeProvider>
              <ToastProvider>
                {children}
                <ToastContainer />
              </ToastProvider>
            </ThemeModeProvider>
          </AppRouterCacheProvider>
        </SessionClientProvider>
      </body>
    </html>
  );
}
