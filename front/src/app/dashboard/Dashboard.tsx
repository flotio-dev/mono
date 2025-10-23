'use client';

import {
  Box,
  Stack,
  Typography,
  Button,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import { useEffect, useState } from 'react';
import { getTranslations } from '../../lib/clientTranslations';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import Menu from '../components/Menu';

const projects = [
  { name: 'Test Project', slug: 'Test' },
  { name: 'Noname Project', slug: 'Noname' },
];

const activities = [
  { date: '24/07/2025 : 11h47 AM', desc: 'New build created for project Noname Project.' },
  { date: '24/07/2025 : 10h11 AM', desc: 'Added a environment variable.' },
  { date: '24/07/2025 : 10h06 AM', desc: 'Created a new project Noname Project.' },
];

const changelog = [
  { label: 'Update', desc: 'Enhancements implemented and an issue resolved.' },
  { label: 'Update', desc: 'Version 3.2 — Two updates delivered, one bug fixed.' },
  { label: 'Bug Fix', desc: 'Fixed: small issue affecting performance.' },
];

function ProjectList({ t }: { t: (k: string) => string }) {
  return (
    <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FolderIcon /> <Typography variant="h6">{t('dashboard.projects')}</Typography>
        </Stack>
        <Link href="/projects" passHref>
          <Button endIcon={<ArrowForwardIcon />} variant="text">
            {t('dashboard.all_projects')}
          </Button>
        </Link>
        <Button
          component="a"
          href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP}/installations/new`}
          target="_blank"
          variant="contained"
          color="primary"
        >
          Install GitHub App
        </Button>
      </Stack>
      <Stack>
        {projects.map((project) => (
          <Stack direction="row" alignItems="center" spacing={2} key={project.name} mb={1}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
              {project.name[0]}
            </Avatar>
            <Typography variant="body1">{project.name}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function RecentActivity({ t }: { t: (k: string) => string }) {
  return (
    <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <FolderIcon /> <Typography variant="h6">{t('dashboard.recent_activity')}</Typography>
      </Stack>
      <Stack>
        {activities.map((activity, idx) => (
          <Stack direction="row" alignItems="center" spacing={2} key={idx} mb={1}>
            <Chip label={activity.date} variant="outlined" sx={{ minWidth: 140, fontWeight: 'bold' }} />
            <Typography variant="body2">{activity.desc}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function Changelog({ t }: { t: (k: string) => string }) {
  return (
    <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <FolderIcon /> <Typography variant="h6">{t('dashboard.changelog')}</Typography>
      </Stack>
      <Stack>
        {changelog.map((change, idx) => (
          <Stack direction="row" alignItems="center" spacing={2} key={idx} mb={1}>
            <Chip
              label={change.label}
              color={change.label === 'Bug Fix' ? 'error' : 'info'}
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
            <Typography variant="body2">{change.desc}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

export default function DashboardPage() {
  const [translations, setTranslations] = useState<Record<string, unknown> | null>(null);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const getPreferredLocale = (p?: string | null) => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
      if (stored === 'en' || stored === 'fr') return stored;
    } catch { }
    if (!p) return 'fr';
    const parts = p.split('/');
    const candidate = parts[1];
    if (candidate === 'en' || candidate === 'fr') return candidate;
    return 'fr';
  };

  const [locale, setLocale] = useState(() => {
    if (typeof window === 'undefined') return 'fr';
    return getPreferredLocale(pathname);
  });

  useEffect(() => {
    let mounted = true;
    const load = async (loc: string) => {
      const json = await getTranslations(loc);
      if (mounted) setTranslations(json);
    };
    load(locale);

    const onLocaleChanged = (e: CustomEvent) => {
      const newLoc = e?.detail ?? (typeof window !== 'undefined' ? localStorage.getItem('lang') : null);
      if (newLoc) setLocale(newLoc);
    };

    window.addEventListener('localeChanged', onLocaleChanged as EventListener);
    const onStorage = () => onLocaleChanged(new CustomEvent('storage'));
    window.addEventListener('storage', onStorage);

    return () => {
      mounted = false;
      window.removeEventListener('localeChanged', onLocaleChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [locale, pathname, setLocale]);

  const t = (key: string) => {
    if (!translations) return key;
    const parts = key.split('.');
    let cur: unknown = translations;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = (cur as Record<string, unknown>)[p];
      else return key;
    }
    return typeof cur === 'string' ? cur : key;
  };
  return (
    <Box display="flex" minHeight="100vh">
      <a href=""></a>
      <Menu />
      <Box component="main" flex={1} p={4}>
        <Stack spacing={4}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <SpaceDashboardIcon fontSize="large" color="primary" />

            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {t('menu.dashboard')}
            </Typography>
          </Stack>
          <ProjectList t={t} />
          <RecentActivity t={t} />
          <Changelog t={t} />
        </Stack>
      </Box>
    </Box>
  );
}
