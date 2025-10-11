'use client';

import {
  Box,
  Typography,
  Button,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Stack,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { getTranslations } from '../../lib/clientTranslations';

import MoreVertIcon from '@mui/icons-material/MoreVert';

import Menu from '../components/Menu';

interface Token {
  name: string;
  status: string;
  value: string;
  lastUsed: string;
}

const personalTokens: Token[] = [
  { name: 'private_token', status: 'Active', value: 'nWl987654321', lastUsed: '04/09/2025 : 05h48 PM' },
];

const robotTokens: Token[] = [
  { name: 'user', status: 'Active', value: 'dEa123456789', lastUsed: '04/09/2025 : 06h02 PM' },
];

//Fonction pour masquer les valeurs des tokens
function maskValue(value: string): string {
  if (value.length <= 3) return value;
  return value.slice(0, 3) + '*'.repeat(value.length - 3);
}

function TokenTable({ tokens }: { tokens: Token[] }) {
    const [translations, setTranslations] = useState<Record<string, any> | null>(null);

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

  const t = (key: string) => {
    if (!translations) return key;
    const parts = key.split('.');
    let cur: any = translations;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else return key;
    }
    return typeof cur === 'string' ? cur : key;
  };
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('common.name')}</TableCell>
            <TableCell>{t('access_token.status')}</TableCell>
            <TableCell>{t('common.value')}</TableCell>
            <TableCell>{t('access_token.last_used')}</TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tokens.map((token, idx) => (
            <TableRow key={token.name + idx}>
              <TableCell>{token.name}</TableCell>
              <TableCell>{token.status}</TableCell>
              <TableCell>{maskValue(token.value)}</TableCell>
              <TableCell>{token.lastUsed}</TableCell>
              <TableCell align="right">
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function AccessToken() {
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);

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

  const t = (key: string) => {
    if (!translations) return key;
    const parts = key.split('.');
    let cur: any = translations;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else return key;
    }
    return typeof cur === 'string' ? cur : key;
  };
  return (
    <Box display="flex" minHeight="100vh">
      <Menu />
      <Box component="main" flex={1} p={4}>
        <Typography variant="h4" mb={4}>
          {t('access_token.title')}
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">{t('menu.tokens')}</Typography>
          <Button variant="outlined">+ {t('access_token.title')}</Button>
        </Stack>
        <TokenTable tokens={personalTokens} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">{t('access_token.robot_users')}</Typography>
          <Button variant="outlined">+ {t('access_token.title')}</Button>
        </Stack>
        <TokenTable tokens={robotTokens} />
      </Box>
    </Box>
  );
}
