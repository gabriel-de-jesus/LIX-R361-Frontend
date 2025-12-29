import '../styles/globals.css';
import 'highlight.js/styles/github-dark.css';
import type { AppProps } from 'next/app';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App({ Component, pageProps }: AppProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    // Fallback to normal rendering if Google client ID is not configured
    return <Component {...pageProps} />;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Component {...pageProps} />
    </GoogleOAuthProvider>
  );
}
