// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  
  // Adjust this value in production, or use tracesSampleRate to sample a percentage of transactions
  tracesSampleRate: 0.1,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Only send errors in production to avoid noise during development
  enabled: process.env.NODE_ENV === 'production',
  
  // Focus on the most important errors only
  beforeSend(event) {
    // Only report server errors, not regular 404s or client issues
    if (event.level !== 'error' || 
        (event.exception?.values?.[0]?.type === 'NotFoundError')) {
      return null;
    }
    
    return event;
  },
});