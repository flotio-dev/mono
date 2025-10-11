"use client";
import Menu from "@/app/components/Menu";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import { getTranslations } from '../../../lib/clientTranslations';
import { useSession } from "next-auth/react";


export default function AddMembers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Détection de la langue
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
  const [locale, setLocale] = useState(() => getPreferredLocale(typeof window !== 'undefined' ? window.location.pathname : '/'));

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
  }, [locale]);

  useEffect(() => {
    if (!userName || userName.length < 2) {
      setUserOptions([]);
      return;
    }
    let active = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const keycloak_base_url = process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL;
      const keycloak_realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
      const url = `${keycloak_base_url}/admin/realms/${keycloak_realm}/users?search=${encodeURIComponent(userName)}`;
      try {
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${session?.accessToken || ""}`
          }
        });
        if (!res.ok) throw new Error("Erreur API Keycloak");
        const users = await res.json();
        if (active) setUserOptions(users);
      } catch {
        if (active) setUserOptions([]);
      } finally {
        if (active) setLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => { active = false; };
  }, [userName, session]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const keycloak_base_url = process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL;
    const keycloak_realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
    const orgId = localStorage.getItem('organizationId');
    const url = `${keycloak_base_url}/admin/realms/${keycloak_realm}/organizations/${orgId}/members/invite-user`;

    const idNewMember = userId; // Récupéré via l'autocomplete
    if (!idNewMember) {
      alert(t('organization.select_user_error') || 'Veuillez sélectionner un utilisateur dans la liste.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append("userId", idNewMember);
      formData.append("role", role);
      if (email) formData.append("email", email);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.accessToken || ""}`
        },
        body: formData
      });
      if (!res.ok) {
        const error = await res.text();
        alert(t('organization.add_member_error') + ': ' + error);
        return;
      }
      alert(t('organization.add_member_success'));
      router.push("/organization");
    } catch (err: any) {
      alert(t('organization.add_member_error') + ': ' + err?.message);
    }
  };

  return (
    <Box display="flex" minHeight="100vh">
      <Menu />
      <Box display="flex" flexDirection="column" alignItems="center" flex={1} sx={{ mt: 2 }}>
        <Typography variant="h4" className="font-bold" sx={{ mt: 14, mb: 10 }}>
          {t('organization.add_member_in_organization')} : Org name
        </Typography>
        <form onSubmit={handleSubmit} style={{ minWidth: 300 }}>
          <Autocomplete
            freeSolo={false}
            options={userOptions}
            getOptionLabel={option => option.username + (option.email ? ` (${option.email})` : "")}
            loading={loadingUsers}
            onInputChange={(_, value) => {
              setUserName(value);
              setUserId(null);
            }}
            onChange={(_, value) => {
              if (value) {
                setUserName(value.username);
                setUserId(value.id);
                setEmail(value.email);
              } else {
                setUserId(null);
              }
            }}
            renderOption={(props, option, { inputValue }) => {
              // Highlight le texte recherché
              const { key, ...rest } = props;
              const label = option.username + (option.email ? ` (${option.email})` : "");
              const parts = label.split(new RegExp(`(${inputValue})`, 'gi'));
              return (
                <ListItem key={key} {...rest} alignItems="flex-start" sx={{ py: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                      {option.username?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <span>
                        {parts.map((part, i) =>
                          part.toLowerCase() === inputValue.toLowerCase() ? (
                            <span key={i} style={{ fontWeight: 700, color: '#1976d2' }}>{part}</span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </span>
                    }
                    secondary={option.email}
                  />
                </ListItem>
              );
            }}
            noOptionsText={t('organization.no_user_found') || 'Aucun utilisateur trouvé'}
            renderInput={params => (
              <TextField
                {...params}
                label={t('common.username')}
                variant="outlined"
                margin="normal"
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress color="primary" size={20} sx={{ mr: 2 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ mb: 2, background: '#f8fafc', borderRadius: 2 }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">{t('organization.role')}</InputLabel>
            <Select
              labelId="role-label"
              value={role}
              label={t('organization.role')}
              onChange={e => setRole(e.target.value)}
              required
            >
              <MenuItem value="admin">{t('organization.admin') || 'Admin'}</MenuItem>
              <MenuItem value="writer">{t('organization.writer') || 'Writer'}</MenuItem>
              <MenuItem value="reader">{t('organization.reader') || 'Reader'}</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            {t('common.add') || 'Ajouter'}
          </Button>
        </form>
      </Box>
    </Box>
  );
}

