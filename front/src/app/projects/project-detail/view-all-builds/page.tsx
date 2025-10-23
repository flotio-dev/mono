"use client";

import {
  Box,
  Typography,
  Stack,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Breadcrumbs,
  Link as MUILink,
  InputAdornment,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SearchIcon from "@mui/icons-material/Search";
import Menu from "../../../components/Menu";
import { useEffect, useState } from "react";
import { getTranslations } from "../../../../lib/clientTranslations";

interface BuildItem {
  id: string;
  status: "success" | "failed" | "running";
  message: string;
  branch: string;
  author: string;
  date: string;
  duration: string;
  commit: string;
}

const mockBuilds: BuildItem[] = [
  {
    id: "build_54",
    status: "success",
    message: "feat: Update video provider configurations",
    branch: "main",
    author: "delikescance",
    date: "2025-10-19T21:21:00Z",
    duration: "2m 0s",
    commit: "26c00b2",
  },
  {
    id: "build_53",
    status: "success",
    message: "feat: add sitemap generation and anime API",
    branch: "main",
    author: "delikescance",
    date: "2025-10-17T20:09:00Z",
    duration: "2m 31s",
    commit: "2169c6e",
  },
  {
    id: "build_52",
    status: "failed",
    message: "feat: Add metadata parsing and caching",
    branch: "main",
    author: "delikescance",
    date: "2025-10-16T23:56:00Z",
    duration: "2m 6s",
    commit: "8cdd761",
  },
];

/*******************
 * Locale helpers
 *******************/
const getPreferredLocale = (p?: string | null) => {
  try {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (stored === "en" || stored === "fr") return stored;
  } catch { }
  if (!p) return "fr";
  const parts = p.split("/");
  const candidate = parts[1];
  if (candidate === "en" || candidate === "fr") return candidate;
  return "fr";
};

const formatDate = (iso: string, locale: string) => {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
};

function StatusChip({
  status,
  t,
}: {
  status: BuildItem["status"];
  t: (k: string) => string;
}) {
  const map = {
    success: {
      icon: <CheckCircleIcon fontSize="small" />,
      color: "success",
      label: t("project_page.success"),
    },
    failed: {
      icon: <CancelIcon fontSize="small" />,
      color: "error",
      label: t("project_page.failed"),
    },
    running: {
      icon: <ScheduleIcon fontSize="small" />,
      color: "default",
      label: t("project_page.running"),
    },
  };
  const { icon, color, label } = map[status];
  return <Chip icon={icon} label={label} color={color as any} size="small" />;
}

export default function BuildListPage() {
  const [filter, setFilter] = useState("");
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const [locale, setLocale] = useState(() => getPreferredLocale(pathname));
  const [translations, setTranslations] = useState<Record<string, any> | null>(
    null
  );

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
        (typeof window !== "undefined" ? localStorage.getItem("lang") : null);
      if (newLoc) setLocale(newLoc);
    };

    window.addEventListener("localeChanged", onLocaleChanged as EventListener);
    const onStorage = () => onLocaleChanged(null);
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener(
        "localeChanged",
        onLocaleChanged as EventListener
      );
      window.removeEventListener("storage", onStorage);
    };
  }, [locale, pathname]);

  const t = (key: string) => {
    if (!translations) return key;
    const parts = key.split(".");
    let cur: any = translations;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = cur[p];
      else return key;
    }
    return typeof cur === "string" ? cur : key;
  };

  const filteredBuilds = mockBuilds.filter((b) =>
    b.message.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Box className="flex h-screen">
      {/* Sidebar */}
      <Menu />
      {/* Main */}
      <Box
        className="flex-1 overflow-auto"
        sx={{ p: 6, bgcolor: 'background.default' }}
      >
        {/* Header */}
        <Stack spacing={1} mb={4}>
          <Breadcrumbs aria-label="breadcrumb">
            <MUILink underline="hover" color="text.primary" href="/projects">
              {t("project_page.projects")}
            </MUILink>
            <MUILink
              underline="hover"
              color="text.primary"
              href="/projects/project-detail"
            >
              Test Project
            </MUILink>
            <Typography color="text.primary">
              {t("build_list.title")}
            </Typography>
          </Breadcrumbs>
          <Typography variant="h5" color="text.primary">{t("build_list.title")}</Typography>
        </Stack>

        {/* Search */}
        <TextField
          placeholder={t("build_list.filter_placeholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Table */}
        <Paper className="rounded-xl shadow-sm">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("build_list.status")}</TableCell>
                  <TableCell>{t("build_list.commit")}</TableCell>
                  <TableCell>{t("build_list.branch")}</TableCell>
                  <TableCell>{t("build_list.author")}</TableCell>
                  <TableCell>{t("build_list.date")}</TableCell>
                  <TableCell>{t("build_list.duration")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBuilds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        {t("build_list.no_builds")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBuilds.map((b) => (
                    <TableRow
                      key={b.id}
                      hover
                      sx={{
                        "&:nth-of-type(odd) td": {
                          bgcolor: "background.paper",
                        },
                        "&:nth-of-type(even) td": {
                          bgcolor: "background.default",
                        },
                        "&:hover td": { bgcolor: "action.hover" },
                        transition: "background-color 120ms ease",
                      }}
                    >
                      <TableCell>
                        <StatusChip status={b.status} t={t} />
                      </TableCell>
                      <TableCell>
                        <MUILink underline="hover" href={`/builds/${b.id}`}>
                          {b.message}
                        </MUILink>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {b.commit}
                        </Typography>
                      </TableCell>
                      <TableCell>{b.branch}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 24, height: 24 }}>
                            {b.author[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">{b.author}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{formatDate(b.date, locale)}</TableCell>
                      <TableCell>{b.duration}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}
