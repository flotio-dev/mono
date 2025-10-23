'use client';

import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Link as MUILink,
  Breadcrumbs,
  Card,
  CardContent,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PeopleIcon from '@mui/icons-material/People';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LanIcon from '@mui/icons-material/Lan';
import CloudIcon from '@mui/icons-material/Cloud';
import Menu from '../../components/Menu';
import { useEffect, useMemo, useState } from 'react';
import { getTranslations } from '../../../lib/clientTranslations';
import Grid from '@mui/material/Grid';

/*******************
 * Types & Mock Data
 *******************/
interface BuildItem {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: 'success' | 'failed' | 'running';
  description: string;
}

interface BuildSettings {
  provider: string;
  branch: string;
  buildCommand: string;
  outputDir: string;
  nodeVersion?: string;
}

interface Ownership {
  type: 'organization' | 'user';
  name: string;
}

interface Project {
  name: string;
  slug: string;
  urlPath: string;
  createdAt: string;
  lastActivityAt: string;
  lastActivityDescription: string;
  ownership: Ownership;
  buildSettings: BuildSettings;
  stats: {
    total: number;
    success: number;
    failed: number;
  };
  recentBuilds: BuildItem[];
}

const formatDate = (iso: string, locale: string) => {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
};

const mockProject: Project = {
  name: 'Test Project',
  slug: 'test-project',
  urlPath: '/build/test-project',
  createdAt: '2025-05-01T09:30:00Z',
  lastActivityAt: '2025-07-24T09:47:00Z',
  lastActivityDescription: 'Build #42 from main deployed to preview.',
  ownership: { type: 'organization', name: 'Acme Inc.' },
  buildSettings: {
    provider: 'Custom Runner',
    branch: 'main',
    buildCommand: 'pnpm build',
    outputDir: 'out',
    nodeVersion: '20',
  },
  stats: {
    total: 73,
    success: 66,
    failed: 5,
  },
  recentBuilds: [
    {
      id: 'build_0073',
      startedAt: '2025-07-24T09:30:00Z',
      finishedAt: '2025-07-24T09:47:00Z',
      status: 'success',
      description: 'Commit 9afc1e1 — Optimize images',
    },
    {
      id: 'build_0072',
      startedAt: '2025-07-23T15:12:00Z',
      finishedAt: '2025-07-23T15:25:00Z',
      status: 'failed',
      description: 'Commit 1b23cde — Fix env var typo',
    },
    {
      id: 'build_0071',
      startedAt: '2025-07-22T11:05:00Z',
      status: 'running',
      description: 'Commit 7c3aa91 — Add analytics',
    },
  ],
};

/*******************
 * Locale helpers
 *******************/
const detectLocale = (p?: string | null) => {
  if (!p) return 'fr';
  const parts = p.split('/');
  const candidate = parts[1];
  if (candidate === 'en' || candidate === 'fr') return candidate;
  return 'fr';
};

const getPreferredLocale = (p?: string | null) => {
  try {
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
    if (stored === 'en' || stored === 'fr') return stored;
  } catch { }
  if (!p) return 'fr';
  const parts = p.split('/');
  const candidate = parts[1];
  if (candidate === 'en' || candidate === 'fr') return candidate;
  return 'fr';
};

/*******************
 * Status chip
 *******************/
function StatusChip({ status, t }: { status: BuildItem['status'], t: (key: string) => string }) {
  const map: Record<
    BuildItem['status'],
    { label: string; icon: React.ReactNode; color: 'success' | 'error' | 'default' }
  > = {
    success: {
      label: t("project_page.success"),
      icon: <CheckCircleIcon fontSize="small" />,
      color: 'success',
    },
    failed: {
      label: t("project_page.failed"),
      icon: <CancelIcon fontSize="small" />,
      color: 'error',
    },
    running: {
      label: t("project_page.running"),
      icon: <ScheduleIcon fontSize="small" />,
      color: 'default',
    },
  };
  const { label, icon, color } = map[status];
  return (
    <Chip
      icon={icon as any}
      label={label}
      color={color}
      variant={status === 'running' ? 'outlined' : 'filled'}
      size="small"
    />
  );
}

/*******************
 * Settings Tabs
 *******************/
function SettingsTabs({ t }: { t: (key: string) => string }) {
  const [tab, setTab] = useState(0);
  return (
    <Paper className="rounded-xl shadow-sm" sx={{ p: 2 }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        aria-label="project settings tabs"
        sx={{ mb: 2 }}
      >
        <Tab icon={<LanIcon />} iconPosition="start" label={t("project_page.environment")} />
        <Tab icon={<CloudIcon />} iconPosition="start" label={t("project_page.environment_variables")} />
        <Tab icon={<VpnKeyIcon />} iconPosition="start" label={t("project_page.api_keys")} />
        <Tab icon={<PeopleIcon />} iconPosition="start" label={t("project_page.members")} />
      </Tabs>
      {/* Onglet 0 : Environnement */}
      {tab === 0 && (
        <Stack spacing={2}>
          <TextField label={t("project_page.env_name")} placeholder="production" fullWidth />
          <TextField label={t("project_page.production_url")} placeholder="https://app.example.com" fullWidth />
          <TextField label={t("project_page.staging_url")} placeholder="https://preview.example.com" fullWidth />
          <Stack direction="row" spacing={2}>
            <Button variant="contained">{t("project_page.save")}</Button>
            <Button>{t("project_page.cancel")}</Button>
          </Stack>
        </Stack>
      )}

      {/* Onglet 1 : Variables d'environnement */}
      {tab === 1 && (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label={t("project_page.key")} placeholder="NEXT_PUBLIC_API_URL" fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label={t("project_page.value")} placeholder="https://api.example.com" fullWidth />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2}>
            <Button variant="contained">{t("project_page.add_variable")}</Button>
            <Button>{t("project_page.cancel")}</Button>
          </Stack>
          <Divider />
          <Typography variant="subtitle2">{t("project_page.existing_variables")}</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("project_page.key")}</TableCell>
                  <TableCell>{t("project_page.value")}</TableCell>
                  <TableCell align="right">{t("project_page.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow hover>
                  <TableCell>NEXT_PUBLIC_API_URL</TableCell>
                  <TableCell>https://api.example.com</TableCell>
                  <TableCell align="right">
                    <IconButton size="small"><MoreVertIcon /></IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}

      {/* Onglet 2 : Clés API */}
      {tab === 2 && (
        <Stack spacing={2}>
          <TextField label={t("project_page.key_name")} placeholder="Dashboard token" fullWidth />
          <TextField label={t("project_page.description")} placeholder={t("project_page.key_description")} fullWidth />
          <Stack direction="row" spacing={2}>
            <Button variant="contained">{t("project_page.generate")}</Button>
            <Button>{t("project_page.cancel")}</Button>
          </Stack>
          <Divider />
          <Typography variant="subtitle2">{t("project_page.existing_keys")}</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("project_page.name")}</TableCell>
                  <TableCell>{t("project_page.last_used")}</TableCell>
                  <TableCell align="right">{t("project_page.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow hover>
                  <TableCell>Dashboard token</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell align="right">
                    <IconButton size="small"><MoreVertIcon /></IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}

      {/* Onglet 3 : Membres */}
      {tab === 3 && (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label={t("project_page.invite_member")} placeholder="email@example.com" fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button variant="contained" sx={{ height: '100%' }}>
                {t("project_page.send_invite")}
              </Button>
            </Grid>
          </Grid>
          <Divider />
          <Typography variant="subtitle2">{t("project_page.project_members")}</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("project_page.member")}</TableCell>
                  <TableCell>{t("project_page.role")}</TableCell>
                  <TableCell align="right">{t("project_page.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar>JL</Avatar>
                      <div>
                        <Typography variant="body2">Jean Luc</Typography>
                        <Typography variant="caption" color="text.secondary">jean.luc@example.com</Typography>
                      </div>
                    </Stack>
                  </TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell align="right">
                    <IconButton size="small"><MoreVertIcon /></IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}
    </Paper>
  );
}

/*******************
 * Main Page Component
 *******************/
export default function ProjectPage() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const [locale, setLocale] = useState(() => getPreferredLocale(pathname));
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async (loc: string) => {
      const json = await getTranslations(loc);
      if (mounted) setTranslations(json);
    };
    load(locale);

    const onLocaleChanged = (e: any) => {
      const newLoc =
        e?.detail ??
        (typeof window !== 'undefined' ? localStorage.getItem('lang') : null);
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

  const project: Project = useMemo(() => {
    const parts = pathname.split('/');
    const slug = parts[parts.length - 1] || mockProject.slug;
    return { ...mockProject, slug, name: mockProject.name };
  }, [pathname]);

  const successRate = useMemo(() => {
    const denom = Math.max(1, project.stats.total);
    return Math.round((project.stats.success / denom) * 100);
  }, [project.stats]);

  return (
    <Box className="flex h-screen">
      {/* Sidebar */}
      <Menu />

      {/* Main Content */}
      <Box className="flex-1 p-6 bg-gray-50 overflow-auto">
        {/* Header */}
        <Box className="flex justify-between items-start mb-6">
          <Stack spacing={1}>
            <Breadcrumbs aria-label="breadcrumb">
              <MUILink underline="hover" color="inherit" href="/projects">
                {t("project_page.projects")}
              </MUILink>
              <Typography color="text.primary">{project.name}</Typography>
            </Breadcrumbs>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                {project.name[0]}
              </Avatar>
              <div>
                <Typography variant="h4" className="font-bold">
                  {project.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={
                      project.ownership.type === 'organization'
                        ? `${t("project_page.organization")}: ${project.ownership.name}`
                        : `${t("project_page.user")}: ${project.ownership.name}`
                    }
                  />
                  <Chip
                    size="small"
                    label={`${t("project_page.created_at")} ${formatDate(project.createdAt, locale)}`}
                  />
                </Stack>
              </div>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Tooltip title={t("project_page.build_route")}>
              <Button variant="outlined" startIcon={<LinkIcon />}>
                {project.urlPath}
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
            >
              {t("project_page.start_build")}
            </Button>
            <Button variant="outlined" startIcon={<SettingsIcon />}>
              {t("project_page.settings")}
            </Button>
          </Stack>
        </Box>

        {/* Top Stats & Build Settings */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card className="rounded-xl shadow-sm">
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">{t("project_page.overview")}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("project_page.last_activity")}: {formatDate(project.lastActivityAt, locale)}
                  </Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper className="rounded-xl" sx={{ p: 2 }}>
                      <Typography variant="overline">{t("project_page.total_builds")}</Typography>
                      <Typography variant="h5">{project.stats.total}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper className="rounded-xl" sx={{ p: 2 }}>
                      <Typography variant="overline">{t("project_page.success")}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon fontSize="small" />
                        <Typography variant="h5">{project.stats.success}</Typography>
                        <Chip size="small" label={`${successRate}%`} />
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper className="rounded-xl" sx={{ p: 2 }}>
                      <Typography variant="overline">{t("project_page.failed")}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CancelIcon fontSize="small" />
                        <Typography variant="h5">{project.stats.failed}</Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  {t("project_page.last_activity_description")}
                </Typography>
                <Typography variant="body1">
                  {project.lastActivityDescription}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="rounded-xl shadow-sm">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t("project_page.build_settings")}
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">{t("project_page.provider")}</Typography>
                    <Typography>{project.buildSettings.provider}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">{t("project_page.branch")}</Typography>
                    <Typography>{project.buildSettings.branch}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">{t("project_page.command")}</Typography>
                    <Typography>{project.buildSettings.buildCommand}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">{t("project_page.output_dir")}</Typography>
                    <Typography>{project.buildSettings.outputDir}</Typography>
                  </Stack>
                  {project.buildSettings.nodeVersion && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Node</Typography>
                      <Typography>{project.buildSettings.nodeVersion}</Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Builds Table */}
        <Box mt={3}>
          <Paper className="rounded-xl shadow-sm" sx={{ p: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="h6">{t("project_page.builds")}</Typography>
              <Button
                size="small"
                href="/projects/project-detail/view-all-builds"
              >
                {t("project_page.view_all")}
              </Button>
            </Stack>
            {project.recentBuilds.length === 0 ? (
              <Typography color="text.secondary">
                {t("project_page.no_builds_yet")}
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>{t("project_page.status")}</TableCell>
                      <TableCell>{t("project_page.start")}</TableCell>
                      <TableCell>{t("project_page.end")}</TableCell>
                      <TableCell>{t("project_page.description")}</TableCell>
                      <TableCell align="right">{t("project_page.actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.recentBuilds.map((b) => (
                      <TableRow key={b.id} hover>
                        <TableCell>
                          <MUILink
                            //href={`/${detectLocale(pathname)}/builds/${b.id}`}
                            href={`/projects/project-detail/build`}
                            underline="none"
                          >
                            {b.id}
                          </MUILink>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={b.status} t={t} />
                        </TableCell>
                        <TableCell>{formatDate(b.startedAt, locale)}</TableCell>
                        <TableCell>
                          {b.finishedAt
                            ? formatDate(b.finishedAt, locale)
                            : '—'}
                        </TableCell>
                        <TableCell>{b.description}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>

        {/* Settings Section */}
        <Box mt={3}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <SettingsIcon />
            <Typography variant="h6">{t("project_page.edit_project")}</Typography>
          </Stack>
          <SettingsTabs t={t} />
        </Box>
      </Box>
    </Box>
  );
}
