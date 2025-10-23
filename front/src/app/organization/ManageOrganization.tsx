"use client";

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
  Menu as MuiMenu,
  MenuItem,
  TextField
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import Menu from '../components/Menu';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTranslations } from '../../lib/clientTranslations';
import { useSession } from "next-auth/react";

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: string;
  lastLoggedIn?: string;
  role?: string;
}

/** Mock users pour tests */
const mockUsers: User[] = [
  {
    id: "1",
    username: "delikescance",
    firstName: "Alex",
    lastName: "Martin",
    email: "alex.martin@example.com",
    emailVerified: "true",
    lastLoggedIn: "2025-10-21T18:30:00Z",
    role: "Admin",
  },
  {
    id: "2",
    username: "jdoe",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    emailVerified: "true",
    lastLoggedIn: "2025-10-20T10:45:00Z",
    role: "Member",
  },
];

export default function ManageOrganization() {
  const { data: session, status } = useSession();
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orgInfo, setOrgInfo] = useState({
    name: "Flotio Org",
    description: "Organisation de test",
    slug: "flotio-org"
  });
  const [editMode, setEditMode] = useState(false);
  const [orgDraft, setOrgDraft] = useState({ name: "", description: "", slug: "" });
  const isAdmin = true;

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
  const [locale, setLocale] = useState(() => getPreferredLocale(pathname));

  function t(key: string) {
    if (!translations) return key;
    const parts = key.split('.');
    let cur: any = translations;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else return key;
    }
    return typeof cur === 'string' ? cur : key;
  }

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(e.currentTarget);
    setSelectedUser(user);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  useEffect(() => {
    let mounted = true;
    const load = async (loc: string) => {
      const json = await getTranslations(loc);
      if (mounted) setTranslations(json);
    };
    load(locale);

    // injection des mock users (temporaire)
    setUsers(mockUsers);

    return () => {
      mounted = false;
    };
  }, [locale]);

  return (
    <Box className="flex h-screen">
      {/* Sidebar */}
      <Menu />
      {/* Main Content */}
      <Box className="flex-1 p-6" sx={{ bgcolor: 'background.default' }}>
        {/* Organization Info Section */}
        <Box mb={4} p={3} component={Paper} sx={{ bgcolor: 'background.paper' }}>
          <Typography variant="h5" fontWeight={700} mb={2} color='text.primary'>
            {t('organization.organization_info')}
          </Typography>
          {editMode ? (
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={e => { e.preventDefault(); setOrgInfo(orgDraft); setEditMode(false); }}>
              <TextField label={t('common.name')} value={orgDraft.name} onChange={(e) => setOrgDraft({ ...orgDraft, name: e.target.value })} required />
              <TextField label={t('common.description')} value={orgDraft.description} onChange={(e) => setOrgDraft({ ...orgDraft, description: e.target.value })} multiline minRows={2} />
              <TextField label={t('common.slug')} value={orgDraft.slug} onChange={(e) => setOrgDraft({ ...orgDraft, slug: e.target.value })} required />
              <Box display="flex" gap={2} mt={1}>
                <Button type="submit" variant="contained" color="primary">{t('common.save')}</Button>
                <Button variant="outlined" color="secondary" onClick={() => { setEditMode(false); setOrgDraft(orgInfo); }}>{t('common.cancel')}</Button>
              </Box>
            </Box>
          ) : (
            <>
              <Typography><b>{t('common.name')}:</b> {orgInfo.name}</Typography>
              <Typography><b>{t('common.description')}:</b> {orgInfo.description}</Typography>
              <Typography><b>{t('common.slug')}:</b> {orgInfo.slug}</Typography>
              {isAdmin && (
                <Button variant="contained" color="primary" onClick={() => setEditMode(true)}>{t('common.edit')}</Button>
              )}            
            </>
          )}
        </Box>

        {/* Header */}
        <Box className="flex justify-between items-center mb-6">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SupervisedUserCircleIcon fontSize="large" color="primary" />
            <Typography variant="h4" className="font-bold" color='text.primary'>
              {t('organization.users_in_organization')} : {orgInfo.name}
            </Typography>
          </Stack>
        </Box>

        {/* Add Member Button */}
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Link href="/organization/add-members" style={{ textDecoration: 'none' }}>
            <Button variant="contained" color="primary">
              {t('organization.add_user')}
            </Button>
          </Link>
        </Box>

        {/* Table of members */}
        <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">{t('common.first_name')}</TableCell>
                <TableCell align="center">{t('common.last_name')}</TableCell>
                <TableCell align="center">{t('common.username')}</TableCell>
                <TableCell align="center">{t('common.email')}</TableCell>
                <TableCell align="center">{t('organization.role')}</TableCell>
                <TableCell align="center">{t('organization.last_logged_in')}</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell align="center">{user.firstName || '—'}</TableCell>
                  <TableCell align="center">{user.lastName || '—'}</TableCell>
                  <TableCell align="center">{user.username || '—'}</TableCell>
                  <TableCell align="center">{user.email || '—'}</TableCell>
                  <TableCell align="center">{user.role || '—'}</TableCell>
                  <TableCell align="center">{user.lastLoggedIn ? new Date(user.lastLoggedIn).toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Contextual menu */}
        <MuiMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { handleMenuClose(); }}>{t('organization.edit_user')}</MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); }}>{t('organization.delete_user')}</MenuItem>
        </MuiMenu>
      </Box>
    </Box>
  );
}
