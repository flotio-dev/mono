'use client';
import React, { useEffect } from 'react';
import { getTranslations } from '../../lib/clientTranslations';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useProxy } from '@/lib/hooks/useProxy';

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

// Organization popover (compact)
function OrganizationBlock({ t }: { t: (k: string, p?: Record<string, unknown>) => string }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const [orgs, setOrgs] = React.useState<{ name: string; id: string }[]>([]);
  const [current, setCurrent] = React.useState<{ name: string; id: string } | null>(null);
  const router = useRouter();
  const { data, callProxy } = useProxy();

  const callProxyRequests = () => {
    callProxy({
      getOrgsByUser: {
        route: `${process.env.NEXT_PUBLIC_ORGANIZATION_SERVICE_BASE_URL}/users/me/organizations`,
        method: "GET",
      },
    },);
  }

  useEffect(() => {
    callProxyRequests();

    /* const fetchOrgs = async () => {

      if (status === 'authenticated' && userId) {
        try {
          const res = await fetch(`
            ${process.env.NEXT_PUBLIC_GATEWAY_BASE_URL}/api/gateway/proxy`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.accessToken || ""}`
            },
            body: JSON.stringify({
          });
          if (!res.ok) throw new Error('Erreur API orgs');
          const data = await res.json();
          // data doit être un tableau d'objets { name, id }
          setOrgs(Array.isArray(data) ? data : []);
          // Sélectionne la première org par défaut si rien en localStorage
          const storedId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null;
          const found = data.find((o: any) => o.id === storedId);
          setCurrent(found || data[0] || null);
        } catch {
          setOrgs([]);
          setCurrent(null);
        }
      }
    };
    fetchOrgs();*/
  }, [status, session]);

  const handleSelectOrg = (org: { name: string; id: string }) => {
    setOpen(false);
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
        <Typography variant="subtitle2" className="text-gray-600">{current?.name || ''}</Typography>
        <Typography variant="caption" className="text-gray-400">{t('settings.change_org_hint') || 'Click to change / add'}</Typography>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ width: 224, p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('settings.organizations_title') || 'Organizations'}</Typography>
          <Stack spacing={1} sx={{ mb: 1 }}>
            {data?.getOrgsByUser.details.data.map((o: { name: string; id: string }) => (
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

// Profile block shown at the bottom of the menu
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
          <Typography variant="subtitle2" noWrap>
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
              <Avatar sx={{ width: 40, height: 40 }}>{(name?.[0] ?? 'U').toUpperCase()}</Avatar>
              <Box>
                <Typography variant="subtitle1">{name || t('menu.anonymous') || 'Anonymous'}</Typography>
                <Typography variant="caption" color="text.secondary">{email}</Typography>
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
              // Emit the full payload so other parts of the app can consume the token + repositories
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
    <Box className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col" sx={{ height: '100vh' }}>
      {/* Brand */}
      <Stack direction="row" alignItems="center" spacing={1.5} className="mb-1">
        <Box className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
          <RocketLaunchIcon fontSize="small" />
        </Box>
        <Typography variant="h6" className="font-extrabold tracking-tight">
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
                    primaryTypographyProps={{ className: 'text-sm font-medium' }}
                    primary={item.label}
                  />
                </ListItemButton>
              ))}
            </List>
          ))}
        </Stack>
      </Box>

      {/* Footer - profile (fixed) */}
      <Divider className="my-2" />
      <Box>
        <ProfileBlock t={t} />
      </Box>
    </Box>
  );
}
