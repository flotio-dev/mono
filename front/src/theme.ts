'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: true, // active la génération des variables CSS
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
});

export default theme;
