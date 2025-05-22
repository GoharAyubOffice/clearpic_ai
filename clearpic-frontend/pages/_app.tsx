import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from '../components/Navigation';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const supabase = createClientComponentClient();

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navigation />
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionContextProvider>
  );
}
