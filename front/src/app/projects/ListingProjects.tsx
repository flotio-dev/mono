'use client';

import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  IconButton,
  Stack,
  Paper,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import Menu from '../components/Menu';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTranslations } from '../../lib/clientTranslations';

interface Project {
  name: string;
  recentActivity: string;
  slug: string;
}

const projects: Project[] = [
  { name: 'Test Project', recentActivity: '05/05/2025 : 08h21 PM', slug: 'Test' },
  { name: 'Noname Project', recentActivity: '24/07/2025 : 11h47 AM', slug: 'Noname' },
];

export default function ListingProjects() {
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);

  const detectLocale = (p?: string | null) => {
    if (!p) return 'fr';
    const parts = p.split('/');
    const candidate = parts[1];
    if (candidate === 'en' || candidate === 'fr') return candidate;
    return 'fr';
  };

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
    <Box className="flex h-screen">
      {/* Sidebar */}
      <Menu />

      {/* Main Content */}
      <Box className="flex-1 p-6 bg-gray-50">
        {/* Header */}
        <Box className="flex justify-between items-center mb-6">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FolderIcon fontSize="large" color="primary" />
            <Typography variant="h4" className="font-bold">
              {t('listing_projects.projects')}
            </Typography>
          </Stack>
          <Link href="/NewProject" passHref>
            <Button variant="contained" color="primary">
            {t('listing_projects.create_project')}
            </Button>
          </Link>
        </Box>

        {/* Projects Table */}
        <TableContainer component={Paper} className="shadow-md rounded-xl">
          <Table>
            <TableHead>
              <TableRow className="bg-gray-100">
                <TableCell className="font-semibold">{t('common.name')}</TableCell>
                <TableCell className="font-semibold">{t('listing_projects.recent_activity')}</TableCell>
                <TableCell className="font-semibold">Slug</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project, index) => (
                <TableRow
                  key={project.slug}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  hover
                >
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        {project.name[0]}
                      </Avatar>
                      <Typography>{project.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{project.recentActivity}</TableCell>
                  <TableCell>
                    <Typography className="text-gray-600">{project.slug}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
