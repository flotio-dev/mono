'use client';

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
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import Menu from '../components/Menu';

interface Project {
  name: string;
  recentActivity: string;
  slug: string;
}

const projects: Project[] = [
  { name: 'Test Project', recentActivity: '05/05/2025 : 08h21 PM', slug: 'Test' },
  { name: 'Noname Project', recentActivity: '24/07/2025 : 11h47 AM', slug: 'Noname' },
];

export default function ListingProjects() {
  return (
    <Box className="flex h-screen">
      {/* Sidebar */}
      <Menu />

      {/* Main Content */}
      <Box className="flex-1 p-6 bg-gray-50">
        {/* Header */}
        <Box className="flex justify-between items-center mb-6">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FolderIcon fontSize="large" color="primary" />
            <Typography variant="h4" className="font-bold">
              Projects
            </Typography>
          </Stack>
          <Button variant="contained" color="primary">
            + Create a Project
          </Button>
        </Box>

        {/* Projects Table */}
        <TableContainer component={Paper} className="shadow-md rounded-xl">
          <Table>
            <TableHead>
              <TableRow className="bg-gray-100">
                <TableCell className="font-semibold">Project</TableCell>
                <TableCell className="font-semibold">Recent Activity</TableCell>
                <TableCell className="font-semibold">Slug</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project, index) => (
                <TableRow
                  key={project.slug}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  hover
                >
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        {project.name[0]}
                      </Avatar>
                      <Typography>{project.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{project.recentActivity}</TableCell>
                  <TableCell>
                    <Typography className="text-gray-600">{project.slug}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
