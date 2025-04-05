// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  
  // Adjust this value in production, or use tracesSampleRate to sample a percentage of transactions
  tracesSampleRate: 0.1,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  replaysOnErrorSampleRate: 1.0,
  
  // Only send errors in production to avoid noise during development
  enabled: process.env.NODE_ENV === 'production',
  
  // Focus on the most important errors only
  beforeSend(event) {
    // Don't send events for 404s or other expected issues
    if (event.request?.url?.includes('_next/static') || 
        event.request?.url?.includes('/favicon.ico')) {
      return null;
    }
    
    return event;
  },
});