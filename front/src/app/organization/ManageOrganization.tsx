
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

export default function ManageOrganization() {
  const { data: session, status } = useSession();
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orgInfo, setOrgInfo] = useState({
    name: "",
    description: "",
    slug: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [orgDraft, setOrgDraft] = useState({ name: "", description: "", slug: "" });
  const isAdmin = true; // Remplacer par un vrai check de rôle admin

  // Locale & translation
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

  // Translation helper
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

  // State and handlers for MoreVertIcon contextual menu
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

  // Fetch translations and users
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


    // Fetch organization info from Keycloak API
    const fetchOrgInfo = async () => {
      try {
        const keycloakBaseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL || "";
        const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "";
        const orgId = localStorage.getItem('organizationId');
        const url = `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/organizations/${orgId}`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.accessToken || ""}`
          },
        });
        if (!res.ok) {
          console.error("Erreur lors de la récupération de l'organisation:", res.status, await res.text());
          return;
        }
        const org = await res.json();
        setOrgInfo({
          name: org.name || "",
          description: org.description || "",
          slug: org.alias || ""
        });
        setOrgDraft({
          name: org.name || "",
          description: org.description || "",
          slug: org.alias || ""
        });
      } catch (err) {
        console.error("Erreur réseau org:", err);
      }
    };
    fetchOrgInfo();

    // Fetch members from Keycloak API
    const fetchMembers = async () => {
      try {
        const keycloakBaseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL || "";
        const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "";
        const orgId = localStorage.getItem('organizationId');
        const url = `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/organizations/${orgId}/members`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.accessToken || ""}`
          },
        });
        if (!res.ok) {
          console.error("Erreur lors de la récupération des membres:", res.status, await res.text());
          return;
        }
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur réseau:", err);
      }
    };
    fetchMembers();

    window.addEventListener('localeChanged', onLocaleChanged as EventListener);
    const onStorage = () => onLocaleChanged(null);
    window.addEventListener('storage', onStorage);
    return () => {
      mounted = false;
      window.removeEventListener('localeChanged', onLocaleChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [locale]);

  // --- RETURN PRINCIPAL DU COMPOSANT ---
  return (
    <Box className="flex h-screen">
      {/* Sidebar */}
      <Menu/>
      {/* Main Content */}
      <Box className="flex-1 p-6 bg-gray-50">
        {/* Organization Info Section */}
        <Box mb={4} p={3} component={Paper}>
          <Typography variant="h5" fontWeight={700} mb={2}>{t('organization.organization_info') || "Informations de l'organisation"}</Typography>
          {editMode ? (
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={e => { e.preventDefault(); setOrgInfo(orgDraft); setEditMode(false); }}>
              <TextField label={t('common.name') || 'Nom'} value={orgDraft.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgDraft({ ...orgDraft, name: e.target.value })} required />
              <TextField label={t('common.description') || 'Description'} value={orgDraft.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgDraft({ ...orgDraft, description: e.target.value })} multiline minRows={2} />
              <TextField label={t('common.slug') || 'Slug'} value={orgDraft.slug} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgDraft({ ...orgDraft, slug: e.target.value })} required />
              <Box display="flex" gap={2} mt={1}>
                <Button type="submit" variant="contained" color="primary">{t('common.save') || 'Enregistrer'}</Button>
                <Button variant="outlined" color="secondary" onClick={() => { setEditMode(false); setOrgDraft(orgInfo); }}>{t('common.cancel') || 'Annuler'}</Button>
              </Box>
            </Box>
          ) : (
            <>
              <Typography><b>{t('common.name') || 'Nom'}:</b> {orgInfo.name}</Typography>
              <Typography><b>{t('common.description') || 'Description'}:</b> {orgInfo.description}</Typography>
              <Typography><b>{t('common.slug') || 'Slug'}:</b> {orgInfo.slug}</Typography>
              {isAdmin && (
                <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setEditMode(true)}>{t('common.edit') || 'Modifier'}</Button>
              )}
            </>
          )}
        </Box>
        {/* Header */}
        <Box className="flex justify-between items-center mb-6">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SupervisedUserCircleIcon fontSize="large" color="primary" />
            <Typography variant="h4" className="font-bold">
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                 <TableCell align="center">{t('common.first_name') || 'Prénom'}</TableCell>
                 <TableCell align="center">{t('common.last_name') || 'Nom'}</TableCell>
                 <TableCell align="center">{t('common.username') || 'Nom d\'utilisateur'}</TableCell>
                 <TableCell align="center">{t('common.email') || 'Email'}</TableCell>
                 <TableCell align="center">{t('organization.role') || 'Rôle'}</TableCell>
                 <TableCell align="center">{t('organization.last_logged_in') || 'Dernière connexion'}</TableCell>
                 <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                   <TableCell align="center">{user.firstName || '————'}</TableCell>
                   <TableCell align="center">{user.lastName || '————'}</TableCell>
                   <TableCell align="center">{user.username || '————'}</TableCell>
                   <TableCell align="center">{user.email || '————'}</TableCell>
                   <TableCell align="center">{user.role || '————'}</TableCell>
                   <TableCell align="center">{user.lastLoggedIn || '————'}</TableCell>
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
      {/* Contextual menu for user actions (en dehors du map) */}
      <MuiMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { /* Ajoute ici la logique de modification */ handleMenuClose(); }}>
          {t('organization.edit_user')}
        </MenuItem>
        <MenuItem onClick={() => { /* Ajoute ici la logique de suppression */ handleMenuClose(); }}>
          {t('organization.delete_user')}
        </MenuItem>
      </MuiMenu>
    </Box>
  </Box>
  );
}
