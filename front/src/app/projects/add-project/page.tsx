'use client';

import {
  Box,
  Button,
  Typography,
  Stack,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Select,
  MenuItem,
  FormHelperText,
  Paper
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Menu from '../../components/Menu';
import { getTranslations } from '../../../lib/clientTranslations';

export default function AddProjectPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');
  const [newProject, setNewProject] = useState<any>({
    name: '',
    githubConnected: undefined,
    repo: '',
    buildPath: '/',
    flutterVersion: 'stable',
  });
  const [errors, setErrors] = useState<any>({});
  const router = useRouter();

  // Charger locale + traductions
  useEffect(() => {
    let mounted = true;
    const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
    const loc = stored === 'en' || stored === 'fr' ? stored : 'fr';
    setLocale(loc);

    const load = async () => {
      const json = await getTranslations(loc);
      if (mounted) setTranslations(json);
    };
    load();

    return () => {
      mounted = false;
    };
  }, []);

  // helper t()
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

  const steps = [
    t('add_project.steps.name'),
    t('add_project.steps.github'),
    t('add_project.steps.repo'),
    t('add_project.steps.flutter'),
    t('add_project.steps.summary'),
  ];

  const validateStep = () => {
    const newErrors: any = {};
    if (activeStep === 0 && !newProject.name.trim()) {
      newErrors.name = t('add_project.errors.name_required');
    }
    if (activeStep === 2 && newProject.githubConnected && !newProject.repo) {
      newErrors.repo = t('add_project.errors.repo_required');
    }
    if (activeStep === 3 && !newProject.flutterVersion) {
      newErrors.flutterVersion = t('add_project.errors.flutter_required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (activeStep === steps.length - 1) {
      console.log('🚀 Envoi au backend :', newProject);
      router.push(`/projects/${newProject.name}`);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <TextField
            label={t('add_project.fields.project_name')}
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            fullWidth
            error={!!errors.name}
            helperText={errors.name}
          />
        );
      case 1:
        return (
          <Stack spacing={2}>
            <Typography>{t('add_project.steps.github')}</Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={() => {
                  setNewProject({ ...newProject, githubConnected: true });
                  setActiveStep((prev) => prev + 1);
                }}
              >
                {t('add_project.actions.yes_github')}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setNewProject({ ...newProject, githubConnected: false });
                  setActiveStep((prev) => prev + 1);
                }}
              >
                {t('add_project.actions.no_github')}
              </Button>
            </Stack>
          </Stack>
        );
      case 2:
        return (
          <Stack spacing={2}>
            <Typography>{t('add_project.steps.repo')}</Typography>
            <Select
              value={newProject.repo}
              onChange={(e) => setNewProject({ ...newProject, repo: e.target.value })}
              fullWidth
              error={!!errors.repo}
            >
              <MenuItem value="">{`-- ${t('add_project.fields.repo')} --`}</MenuItem>
              <MenuItem value="repo1">repo1</MenuItem>
              <MenuItem value="repo2">repo2</MenuItem>
            </Select>
            {errors.repo && <FormHelperText error>{errors.repo}</FormHelperText>}
            <TextField
              label={t('add_project.fields.build_path')}
              value={newProject.buildPath}
              onChange={(e) => setNewProject({ ...newProject, buildPath: e.target.value })}
              fullWidth
            />
          </Stack>
        );
      case 3:
        return (
          <Stack spacing={2}>
            <Typography>{t('add_project.steps.flutter')}</Typography>
            <Select
              value={newProject.flutterVersion}
              onChange={(e) => setNewProject({ ...newProject, flutterVersion: e.target.value })}
              fullWidth
              error={!!errors.flutterVersion}
            >
              <MenuItem value="stable">Stable</MenuItem>
              <MenuItem value="3.24.2">3.24.2</MenuItem>
              <MenuItem value="3.22.0">3.22.0</MenuItem>
            </Select>
            {errors.flutterVersion && (
              <FormHelperText error>{errors.flutterVersion}</FormHelperText>
            )}
          </Stack>
        );
      case 4:
        return (
          <Stack spacing={2}>
            <Typography variant="h6">{t('add_project.steps.summary')}</Typography>
            <Typography>
              {t('add_project.fields.project_name')} : {newProject.name}
            </Typography>
            <Typography>GitHub : {newProject.githubConnected ? 'Oui' : 'Non'}</Typography>
            {newProject.githubConnected && (
              <>
                <Typography>
                  {t('add_project.fields.repo')} : {newProject.repo}
                </Typography>
                <Typography>
                  {t('add_project.fields.build_path')} : {newProject.buildPath}
                </Typography>
              </>
            )}
            <Typography>
              {t('add_project.fields.flutter_version')} : {newProject.flutterVersion}
            </Typography>
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <Box className="flex h-screen">
      {/* Sidebar */}
      <Menu />

      {/* Main Content */}
      <Box className="flex-1 p-6" sx={{ bgcolor: 'background.default' }}>
        {/* Header */}
        <Box className="flex justify-between items-center mb-6">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FolderIcon fontSize="large" color="primary" />
            <Typography variant="h4" className="font-bold" color="text.primary">
              {t('add_project.title')}
            </Typography>
          </Stack>

          <Link href="/projects" passHref>
            <Button variant="outlined" color="primary">
              {t('add_project.back_to_list')}
            </Button>
          </Link>
        </Box>

        {/* Stepper + content */}
        <Paper className="p-6 shadow-md rounded-xl" sx={{ bgcolor: 'background.paper' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box mt={4}>{renderStep()}</Box>

          {/* Navigation */}
          {activeStep === 1 ? (
            <Box mt={4} display="flex" justifyContent="flex-start">
              <Button onClick={handleBack}>{t('add_project.actions.back')}</Button>
            </Box>
          ) : (
            <Box mt={4} display="flex" justifyContent="space-between">
              <Button disabled={activeStep === 0} onClick={handleBack}>
                {t('add_project.actions.back')}
              </Button>
              <Button variant="contained" onClick={handleNext}>
                {activeStep === steps.length - 1
                  ? t('add_project.actions.create')
                  : t('add_project.actions.next')}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
