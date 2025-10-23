'use client';
import React, { useEffect } from 'react';
import { getTranslations } from '../../lib/clientTranslations';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useProxy } from '@/lib/hooks/useProxy';
import { Switch } from '@mui/material';

import {
  Box,
  Stack,
  Typography,
  List,
  ListSubheader,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Avatar,
  Popover,
} from '@mui/material';
import Link from 'next/link';

// Icons
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import FolderIcon from '@mui/icons-material/Folder';
import GroupIcon from '@mui/icons-material/Group';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import TokenIcon from '@mui/icons-material/Token';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

// Theme provider context
import { useThemeMode } from '@/app/providers/ThemeModeProvider';

/***********************
 * Organization Block
 ***********************/
function OrganizationBlock({ t }: { t: (k: string, p?: Record<string, unknown>) => string }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const [orgs, setOrgs] = React.useState<{ name: string; id: string }[]>([]);
  const [current, setCurrent] = React.useState<{ name: string; id: string } | null>(null);
  const router = useRouter();
  const { data: proxyData, callProxy } = useProxy();

  const callProxyRequests = () => {
    callProxy({
      getOrgsByUser: {
        route: `${process.env.NEXT_PUBLIC_ORGANIZATION_SERVICE_BASE_URL}/users/me/organizations`,
        method: "GET",
      },
    });
  };

  useEffect(() => {
    callProxyRequests();
  }, [status, session]);

  useEffect(() => {
    if (proxyData?.getOrgsByUser?.success) {
      const orgsData = proxyData.getOrgsByUser.details.data;
      setOrgs(Array.isArray(orgsData) ? orgsData : []);
      const storedId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null;
      const found = orgsData.find((o: { name: string; id: string }) => o.id === storedId);
      setCurrent(found || orgsData[0] || null);
    }
  }, [proxyData]);

  const handleSelectOrg = (org: { name: string; id: string }) => {
    setOpen(false);
    setCurrent(org);
    if (typeof window !== 'undefined') {
      localStorage.setItem('organizationId', org.id);
    }
  };

  return (
    <>
      <Box
        ref={anchorRef}
        onClick={() => setOpen(true)}
        sx={{
          p: 1,
          borderRadius: 1,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
          '&:hover': { backgroundColor: 'action.hover', transform: 'translateY(-2px)', boxShadow: 2 },
        }}
      >
        <Typography variant="subtitle2" color="text.primary">
          {current?.name || ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('settings.change_org_hint') || 'Click to change / add'}
        </Typography>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ width: 224, p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t('settings.organizations_title') || 'Organizations'}
          </Typography>
          <Stack spacing={1} sx={{ mb: 1 }}>
            {proxyData?.getOrgsByUser.details.data.map((o: { name: string; id: string }) => (
              <Button
                key={o.id}
                variant={current && o.id === current.id ? 'contained' : 'outlined'}
                onClick={() => handleSelectOrg(o)}
                size="small"
              >
                {o.name}
              </Button>
            ))}
          </Stack>

          <Button
            sx={{ mt: 1 }}
            fullWidth
            onClick={() => {
              setOpen(false);
              router.push('/organization/new-organization');
            }}
            size="small"
            variant="contained"
          >
            {t('settings.add_organization') || 'Add organization'}
          </Button>
        </Box>
      </Popover>
    </>
  );
}

/***********************
 * Profile Block
 ***********************/
function ProfileBlock({ t }: { t: (k: string) => string }) {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const name = session?.user?.name ?? '';
  const email = session?.user?.email ?? '';

  return (
    <>
      <Box
        ref={anchorRef}
        onClick={() => setOpen(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        <Avatar>{(name?.[0] ?? 'U').toUpperCase()}</Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" color="text.primary" noWrap>
            {name || t('menu.anonymous') || 'Anonymous'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {email}
          </Typography>
        </Box>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box sx={{ width: 224, p: 2 }}>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 40, height: 40 }}>
                {(name?.[0] ?? 'U').toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" color="text.primary">
                  {name || t('menu.anonymous') || 'Anonymous'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {email}
                </Typography>
              </Box>
            </Box>

            <Divider />

            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setOpen(false);
                signOut();
              }}
            >
              {t('sign_out')}
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}

/***********************
 * Theme Selector Block
 ***********************/
function ThemeBlock({ t }: { t: (k: string) => string }) {
  const { resolvedMode, toggle } = useThemeMode();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1,
        py: 0.5,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {resolvedMode === "dark" ? <DarkModeIcon /> : <LightModeIcon />}
        <Typography variant="subtitle2" color="text.primary">
          {resolvedMode === "dark" ? t("appearance.dark") : t("appearance.light")}
        </Typography>
      </Stack>
      <Switch
        checked={resolvedMode === "dark"}
        onChange={toggle}
        color="default"
      />
    </Box>
  );
}

/***********************
 * Main Menu
 ***********************/
export default function Menu() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/login');
    }

    if (status === 'authenticated') {
      (async () => {
        try {
          const bearer =
            (session as unknown as { accessToken?: string })?.accessToken ??
            (session as unknown as { user?: { accessToken?: string } })?.user?.accessToken ??
            (session as unknown as { user?: { token?: string } })?.user?.token ??
            (session as unknown as { user?: { access_token?: string } })?.user?.access_token ??
            null;

          if (!bearer) return;

          const res = await fetch('/api/keycloak/github-token', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${bearer}`,
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) {
            console.debug('Failed to fetch github token from broker:', await res.text());
            return;
          }

          const data = await res.json();
          const token = data?.github_access_token ?? data?.token ?? null;
          if (token) {
            console.debug('Got github token (redacted)');
            try {
              if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('githubToken', { detail: data }));
              }
            } catch (err) {
              console.debug('Error emitting github token event:', err);
            }
          }
        } catch (err) {
          console.debug('Error fetching github token from broker:', err);
        }
      })();
    }
  }, [status, session, router]);

  const pathname = usePathname();
  const [translations, setTranslations] = React.useState<Record<string, unknown> | null>(null);

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

  const [locale, setLocale] = React.useState(() => getPreferredLocale(pathname));

  React.useEffect(() => {
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
  }, [locale, pathname]);

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

  const sections = [
    {
      title: t('menu.main'),
      items: [
        { label: t('menu.dashboard'), href: '/dashboard', icon: <SpaceDashboardIcon /> },
        { label: t('menu.projects'), href: '/projects', icon: <FolderIcon /> },
        { label: t('menu.manage_organization'), href: '/organization', icon: <GroupIcon /> },
        { label: t('menu.environment_variables'), href: '/env', icon: <DataObjectIcon /> },
        { label: t('menu.billing'), href: '/billing', icon: <CreditCardIcon /> },
      ],
    },
    {
      title: t('menu.credentials'),
      items: [
        { label: t('menu.credentials_page'), href: '/credentials', icon: <VpnKeyIcon /> },
        { label: t('menu.access_tokens'), href: '/tokens', icon: <TokenIcon /> },
      ],
    },
    {
      title: t('menu.settings'),
      items: [
        { label: t('menu.notifications'), href: '/notifications', icon: <NotificationsIcon /> },
        { label: t('menu.account_settings'), href: '/settings', icon: <SettingsIcon /> },
      ],
    },
  ];

  const isActive = (href: string) => (href !== '/' ? pathname?.startsWith(href) : pathname === '/');

  return (
    <Box
      className="w-64 p-4 flex flex-col"
      sx={{
        height: "100vh",
        bgcolor: "background.paper",
        borderRight: 1,
        borderColor: "divider",
      }}
    >
      {/* Brand */}
      <Stack direction="row" alignItems="center" spacing={1.5} className="mb-1">
        <Box className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
          <RocketLaunchIcon fontSize="small" />
        </Box>
        <Typography variant="h6" className="font-extrabold tracking-tight" color="text.primary">
          Flotio
        </Typography>
      </Stack>

      {/* Organization card */}
      <OrganizationBlock t={t} />

      <Divider className="my-2" />

      {/* Navigation - scrollable area */}
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        <Stack spacing={3}>
          {sections.map((section) => (
            <List
              key={section.title}
              disablePadding
              subheader={
                <ListSubheader
                  component="div"
                  sx={{
                    px: 0,
                    backgroundColor: 'background.paper',
                    color: 'text.secondary',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  {section.title}
                </ListSubheader>
              }
            >
              {section.items.map((item) => (
                <ListItemButton
                  key={item.label}
                  component={Link}
                  href={item.href}
                  selected={isActive(item.href)}
                  sx={{
                    borderRadius: 1.5,
                    px: 1.25,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                    '&.Mui-selected .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: 500,
                      color: "text.primary",
                    }}
                  />
                </ListItemButton>
              ))}

            </List>
          ))}
        </Stack>
      </Box>

      {/* Footer - theme selector + profile */}
      <Divider className="my-2" />
      <Box>
        <ThemeBlock t={t} />
        <ProfileBlock t={t} />
      </Box>
    </Box>
  );
}
