'use client';
import React from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { getTranslations } from '../../lib/clientTranslations';
import { usePathname } from 'next/navigation';


import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  IconButton,
  Divider,
  Avatar,
  Select,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Menu from '../components/Menu';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  
  // Exemples de données fictives
  const plan = 'Free';
  const [githubConnected, setGithubConnected] = React.useState(false);

  const pathname = usePathname();
  const [translations, setTranslations] = React.useState<Record<string, any> | null>(null);

  // Determine locale from pathname prefix (/en/... or /fr/...). Default to 'fr'.
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

  const [locale, setLocale] = React.useState(() => getPreferredLocale(pathname));

  React.useEffect(() => {
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
    window.addEventListener('githubToken', (ev: Event) => {
      const e = ev as CustomEvent;
      const payload = e.detail;
      // payload.github_access_token
      // payload.repositories (array)
      setGithubConnected(!!payload.github_access_token);
    });
    window.addEventListener('localeChanged', onLocaleChanged as EventListener);
    const onStorage = () => onLocaleChanged(null);
    window.addEventListener('storage', onStorage);

    return () => {
      mounted = false;
      window.removeEventListener('localeChanged', onLocaleChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [locale, pathname]);

  const t = (key: string, params?: Record<string, any>) => {
    if (!translations) return key;
    const parts = key.split('.');
    let cur: any = translations;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else return key;
    }
    if (typeof cur === 'string') {
      if (params) return cur.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => params[k] ?? '');
      return cur;
    }
    return key;
  };

  return (
    <Box display="flex" minHeight="100vh">
      <Menu />
      <Box component="main" flex={1} p={4}>
        <Typography variant="h4" fontWeight={700} mb={4} display="flex" alignItems="center" gap={1}>
          <AccountCircleIcon fontSize="large" />
          {t('settings.title')}
        </Typography>

        {/* User settings */}
        <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>{t('settings.user_settings')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('settings.user_settings_description')}
              </Typography>
            </Box>
            <Button variant="outlined" endIcon={<EditIcon />}>
              {t('settings.user_settings_button')}
            </Button>
          </Stack>
        </Paper>

        {/* Account information */}
        <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>{t('settings.account_information')}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography>{t('settings.avatar')}</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ width: 40, height: 40 }}>U</Avatar>
              </Box>
            </Stack>
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography>{t('common.username')}</Typography>
              <Typography>{ session?.user?.name }</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography>{t('settings.plan')}</Typography>
              <Typography>{plan}</Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Connections */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>{t('settings.connections')}</Typography>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>{t('settings.github_status', { status: githubConnected ? t('settings.github_connected') : t('settings.github_not_connected') })}</Typography>
            <Button variant="outlined">
              {githubConnected ? t('settings.disconnect') : t('settings.connect')}
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Language selector */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography>{t('settings.language')}</Typography>
            <Select
              value={locale}
              onChange={(e) => {
                const lang = e.target.value as string;
                try {
                  localStorage.setItem('lang', lang);
                  window.dispatchEvent(new CustomEvent('localeChanged', { detail: lang }));
                } catch (err) {
                  localStorage.setItem('lang_changed_at', Date.now().toString());
                }
                setLocale(lang);
              }}
              size="small"
            >
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
