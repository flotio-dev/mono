'use client';

import {
  Box,
  Typography,
  Button,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Stack,
} from '@mui/material';
import { useTranslation } from 'next-i18next';

import MoreVertIcon from '@mui/icons-material/MoreVert';

import Menu from '../components/Menu';

interface Token {
  name: string;
  status: string;
  value: string;
  lastUsed: string;
}

const personalTokens: Token[] = [
  { name: 'private_token', status: 'Active', value: 'nWl987654321', lastUsed: '04/09/2025 : 05h48 PM' },
];

const robotTokens: Token[] = [
  { name: 'user', status: 'Active', value: 'dEa123456789', lastUsed: '04/09/2025 : 06h02 PM' },
];

//Fonction pour masquer les valeurs des tokens
function maskValue(value: string): string {
  if (value.length <= 3) return value;
  return value.slice(0, 3) + '*'.repeat(value.length - 3);
}

function TokenTable({ tokens }: { tokens: Token[] }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Last used</TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tokens.map((token, idx) => (
            <TableRow key={token.name + idx}>
              <TableCell>{token.name}</TableCell>
              <TableCell>{token.status}</TableCell>
              <TableCell>{maskValue(token.value)}</TableCell>
              <TableCell>{token.lastUsed}</TableCell>
              <TableCell align="right">
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function AccessToken() {
  const { t } = useTranslation('common');
  return (
    <Box display="flex" minHeight="100vh">
      <Menu />
      <Box component="main" flex={1} p={4}>
        <Typography variant="h4" mb={4}>
          {t('access_token.title')}
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">{t('menu.tokens')}</Typography>
          <Button variant="outlined">+ {t('access_token.title')}</Button>
        </Stack>
        <TokenTable tokens={personalTokens} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Robot users</Typography>
          <Button variant="outlined">+ {t('access_token.title')}</Button>
        </Stack>
        <TokenTable tokens={robotTokens} />
      </Box>
    </Box>
  );
}
