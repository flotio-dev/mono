'use client';
import React from 'react';
import { useSession } from "next-auth/react";
import { getTranslations } from '../../lib/clientTranslations';
import { usePathname } from 'next/navigation';

import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  Avatar,
  Select,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Menu from '../components/Menu';

export default function SettingsPage() {
  const { data: session } = useSession();
  
  const plan = 'Free'; // mock plan
  const [githubConnected, setGithubConnected] = React.useState(false);

  const pathname = usePathname();
  const [translations, setTranslations] = React.useState<Record<string, any> | null>(null);

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
      <Box
        component="main"
        flex={1}
        p={4}
        sx={{ bgcolor: 'background.default' }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          mb={4}
          display="flex"
          alignItems="center"
          gap={1}
          color="text.primary"
        >
          <AccountCircleIcon fontSize="large" />
          {t('settings.title')}
        </Typography>

        {/* User settings */}
        <Paper
          variant="outlined"
          sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                {t('settings.user_settings')}
              </Typography>
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
        <Paper
          variant="outlined"
          sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}
        >
          <Typography variant="subtitle1" fontWeight={600} mb={2} color="text.primary">
            {t('settings.account_information')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography color="text.primary">{t('settings.avatar')}</Typography>
              <Avatar sx={{ width: 40, height: 40 }}>
                {session?.user?.name?.[0] || 'U'}
              </Avatar>
            </Stack>
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography color="text.primary">{t('common.username')}</Typography>
              <Typography color="text.secondary">{session?.user?.name}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography color="text.primary">{t('settings.plan')}</Typography>
              <Typography color="text.secondary">{plan}</Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Connections */}
        <Paper
          variant="outlined"
          sx={{ p: 3, bgcolor: 'background.paper' }}
        >
          <Typography variant="subtitle1" fontWeight={600} mb={2} color="text.primary">
            {t('settings.connections')}
          </Typography>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography color="text.primary">
              {t('settings.github_status', {
                status: githubConnected
                  ? t('settings.github_connected')
                  : t('settings.github_not_connected'),
              })}
            </Typography>
            <Button variant="outlined">
              {githubConnected ? t('settings.disconnect') : t('settings.connect')}
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Language selector */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography color="text.primary">{t('settings.language')}</Typography>
            <Select
              value={locale}
              onChange={(e) => {
                const lang = e.target.value as string;
                try {
                  localStorage.setItem('lang', lang);
                  window.dispatchEvent(new CustomEvent('localeChanged', { detail: lang }));
                } catch {
                  localStorage.setItem('lang_changed_at', Date.now().toString());
                }
                setLocale(lang);
              }}
              size="small"
              sx={{ minWidth: 120 }}
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
