import '../styles/globals.css';
import 'highlight.js/styles/github-dark.css';
import type { AppProps } from 'next/app';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Script from 'next/script';

export default function App({ Component, pageProps }: AppProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const app = (
    <>
      {/* Apple Sign in JS SDK */}
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        strategy="beforeInteractive"
      />
      <Component {...pageProps} />
    </>
  );

  if (!clientId) {
    // Fallback to normal rendering if Google client ID is not configured
    return app;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {app}
    </GoogleOAuthProvider>
  );
}
