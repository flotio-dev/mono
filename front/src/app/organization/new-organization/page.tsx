"use client";
import Menu from "@/app/components/Menu";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { getTranslations } from '../../../lib/clientTranslations';
import { useSession } from "next-auth/react";

export default function NewOrganization() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);

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
    // You should set these env variables in your .env.local or process.env
    const keycloakBaseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL || "";
    const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "";

    const url = `${keycloakBaseUrl}/admin/realms/${keycloakRealm}/organizations`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.accessToken || ""}`
        },
        body: JSON.stringify({
          name: orgName,
          description: orgDescription,
          alias: orgSlug,
          domains: [orgName]
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Erreur lors de la création: ${res.status} ${errorText}`);
        return;
      }
      router.push("/dashboard");
    } catch (err: any) {
      alert("Erreur réseau: " + err?.message);
    }
  };

  return (
    <Box display="flex" minHeight="100vh">
      <Menu />
      <Box display="flex" flexDirection="column" alignItems="center" flex={1} sx={{ mt: 4 }}>
        <Typography variant="h4" className="font-bold" sx={{ mt: 14, mb: 10 }}>
          {t('organization.add_organization') || 'Ajouter une organisation'}
        </Typography>
        <form onSubmit={handleSubmit} style={{ minWidth: 300 }}>
          <TextField
            label={t('common.name') || "Nom de l'organisation"}
            variant="outlined"
            fullWidth
            margin="normal"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            required
          />
          <TextField
            label={t('common.description') || 'Description'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={orgDescription}
            onChange={e => setOrgDescription(e.target.value)}
            required
          />
          <TextField
            label={t('common.slug') || 'Slug'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={orgSlug}
            onChange={e => setOrgSlug(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            {t('common.add') || 'Ajouter'}
          </Button>
        </form>
      </Box>
    </Box>
  );
}
