'use client';

import {
  Box,
  Stack,
  Typography,
  Button,
  Paper,
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import Menu from '../components/Menu';

const projects = [
  { name: 'Test Project', slug: 'Test' },
  { name: 'Noname Project', slug: 'Noname' },
];

const activities = [
  { date: '24/07/2025 : 11h47 AM', desc: 'New build created for project Noname Project.' },
  { date: '24/07/2025 : 10h11 AM', desc: 'Added a environment variable.' },
  { date: '24/07/2025 : 10h06 AM', desc: 'Created a new project Noname Project.' },
];

const changelog = [
  { label: 'Update', desc: 'Enhancements implemented and an issue resolved.' },
  { label: 'Update', desc: 'Version 3.2 — Two updates delivered, one bug fixed.' },
  { label: 'Bug Fix', desc: 'Fixed: small issue affecting performance.' },
];

function ProjectList() {
  return (
    <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FolderIcon /> <Typography variant="h6">Projects</Typography>
        </Stack>
        <Link href="/projects" passHref>
          <Button endIcon={<ArrowForwardIcon />} variant="text">
            All Projects
          </Button>
        </Link>
      </Stack>
      <Stack>
        {projects.map((project, idx) => (
          <Stack direction="row" alignItems="center" spacing={2} key={project.name} mb={1}>
            <Avatar sx={{ bgcolor: 'grey.300', color: 'black', width: 32, height: 32, fontWeight: 'bold' }}>
              {project.name}
            </Avatar>
            <Typography variant="body1">{project.name}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function RecentActivity() {
  return (
    <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <FolderIcon /> <Typography variant="h6">Recent Activity</Typography>
      </Stack>
      <Stack>
        {activities.map((activity, idx) => (
          <Stack direction="row" alignItems="center" spacing={2} key={idx} mb={1}>
            <Chip label={activity.date} variant="outlined" sx={{ minWidth: 140, fontWeight: 'bold' }} />
            <Typography variant="body2">{activity.desc}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function Changelog() {
  return (
    <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <FolderIcon /> <Typography variant="h6">Changelog</Typography>
      </Stack>
      <Stack>
        {changelog.map((change, idx) => (
          <Stack direction="row" alignItems="center" spacing={2} key={idx} mb={1}>
            <Chip
              label={change.label}
              color={change.label === 'Bug Fix' ? 'error' : 'info'}
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
            <Typography variant="body2">{change.desc}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

export default function DashboardPage() {
  return (
    <Box display="flex" minHeight="100vh">
      <Menu />
      <Box component="main" flex={1} p={4}>
        <Stack spacing={4}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: 'grey.200',
                color: 'black',
                width: 48,
                height: 48,
                fontSize: 32,
                border: '2px solid black',
                boxShadow: 1,
              }}
            >
              <span role="img" aria-label="dashboard">🎨</span>
            </Avatar>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              Dashboard
            </Typography>
          </Stack>
          <ProjectList />
          <RecentActivity />
          <Changelog />
        </Stack>
      </Box>
    </Box>
  );
}
