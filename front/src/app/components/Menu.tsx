'use client';

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
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Icons
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import FolderIcon from '@mui/icons-material/Folder';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import GroupIcon from '@mui/icons-material/Group';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import TokenIcon from '@mui/icons-material/Token';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Menu() {
  const pathname = usePathname();

  const sections = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <SpaceDashboardIcon /> },
        { label: 'Projects', href: '/projects', icon: <FolderIcon /> },
        { label: 'Usage', href: '/usage', icon: <QueryStatsIcon /> },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Members', href: '/members', icon: <GroupIcon /> },
        { label: 'Environment variables', href: '/env', icon: <DataObjectIcon /> },
      ],
    },
    {
      title: 'Subscription',
      items: [
        { label: 'Billing', href: '/billing', icon: <CreditCardIcon /> },
        { label: 'Receipts', href: '/receipts', icon: <ReceiptLongIcon /> },
      ],
    },
    {
      title: 'Credentials',
      items: [
        { label: 'Credentials', href: '/credentials', icon: <VpnKeyIcon /> },
        { label: 'Access tokens', href: '/tokens', icon: <TokenIcon /> },
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'Notifications', href: '/notifications', icon: <NotificationsIcon /> },
        { label: 'Account settings', href: '/settings', icon: <SettingsIcon /> },
      ],
    },
  ];

  const isActive = (href: string) =>
    href !== '/' ? pathname?.startsWith(href) : pathname === '/';

  return (
    <Box className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
      {/* Brand */}
      <Stack direction="row" alignItems="center" spacing={1.5} className="mb-1">
        <Box className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
          <RocketLaunchIcon fontSize="small" />
        </Box>
        <Typography variant="h6" className="font-extrabold tracking-tight">
          Flotio
        </Typography>
      </Stack>

      {/* Username (garde ton libellé) */}
      <Typography variant="subtitle2" className="text-gray-600">
        Username
      </Typography>

      <Divider className="my-2" />

      {/* Navigation */}
      <Stack spacing={3} className="overflow-auto">
        {sections.map((section) => (
          <List
            key={section.title}
            disablePadding
            subheader={
              <ListSubheader component="div" className="px-0 bg-transparent text-gray-500">
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
  );
}
