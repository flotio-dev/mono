"use client";

import {
  Box,
  Typography,
  Stack,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link as MUILink,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ScheduleIcon from "@mui/icons-material/Schedule";
import Menu from "../../../components/Menu";
import { useEffect, useState } from "react";
import { getTranslations } from "../../../../lib/clientTranslations";

/*******************
 * Types & Mock Data
 *******************/
interface BuildStep {
  id: string;
  name: string;
  status: "success" | "failed" | "running";
  duration: string;
  logs?: string[];
}

const mockSteps: BuildStep[] = [
  { id: "1", name: "Set up job", status: "success", duration: "2s" },
  { id: "2", name: "Checkout", status: "success", duration: "2s" },
  { id: "3", name: "Set up Docker Buildx", status: "success", duration: "10s" },
  {
    id: "4",
    name: "Build and push Docker image",
    status: "success",
    duration: "1m 24s",
    logs: ["docker build -t myimage .", "docker push myimage"],
  },
  { id: "5", name: "Complete job", status: "success", duration: "0s" },
];

/*******************
 * Locale helpers
 *******************/
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
 * Step status chip
 *******************/
function StepStatus({
  status,
  t,
}: {
  status: BuildStep["status"];
  t: (k: string) => string;
}) {
  const map = {
    success: { icon: <CheckCircleIcon color="success" />, label: t("build_details.succeeded") },
    failed: { icon: <CancelIcon color="error" />, label: t("build_details.failed") },
    running: { icon: <ScheduleIcon />, label: t("build_details.running") },
  };
  const { icon, label } = map[status];
  return <Chip icon={icon} label={label} size="small" />;
}

/*******************
 * Page
 *******************/
export default function BuildDetailsPage() {
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
    const parts = key.split(".");
    let cur: any = translations;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = cur[p];
      else return key;
    }
    return typeof cur === "string" ? cur : key;
  };

  const buildId = "build_0073"; // TODO: à récupérer du router

  return (
    <Box className="flex h-screen">
      {/* Sidebar */}
      <Menu />

      {/* Main content */}
      <Box
        className="flex-1 overflow-auto"
        sx={{ p: 6, bgcolor: "background.default" }}
      >
        {/* Header */}
        <Stack spacing={1} mb={4}>
          <Breadcrumbs aria-label="breadcrumb">
            <MUILink underline="hover" color="inherit" href="/projects">
              {t("project_page.projects")}
            </MUILink>
            <MUILink underline="hover" color="inherit" href="/projects/project-detail">
              Test Project
            </MUILink>
            <Typography color="text.primary">
              {t("build_details.title")} {buildId}
            </Typography>
          </Breadcrumbs>

          <Typography variant="h5" color="text.primary">
            {t("build_details.title")} {buildId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("build_details.succeeded")} in 1m45s (3 days ago)
          </Typography>
        </Stack>

        {/* Steps */}
        <Paper
          sx={{
            borderRadius: 2,
            boxShadow: 2,
            bgcolor: "background.paper",
          }}
        >
          {mockSteps.map((step) => (
            <Accordion key={step.id} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                  <StepStatus status={step.status} t={t} />
                  <Typography sx={{ flex: 1 }} color="text.primary">
                    {step.name}
                  </Typography>
                  <Typography color="text.secondary">
                    {step.duration}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {step.logs ? (
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.100",
                      color: theme.palette.mode === "dark" ? "grey.100" : "grey.900",
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowX: "auto",
                      maxHeight: 300,
                    })}
                  >
                    {step.logs.join("\n")}
                  </Paper>
                ) : (
                  <Typography color="text.secondary">
                    {t("build_details.no_logs")}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Box>
    </Box>
  );
}
