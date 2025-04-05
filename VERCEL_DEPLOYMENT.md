# Vercel Deployment Guide

This document explains how to properly deploy the Solis platform on Vercel.

## Environment Variables

You need to configure the following environment variables in the Vercel Dashboard:

### Production Environment (biblioteka.soliopamoka.lt)

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `NEXT_PUBLIC_SITE_URL`: https://biblioteka.soliopamoka.lt
- `NEXT_PUBLIC_SENTRY_DSN` (optional): Your Sentry DSN
- `PAYSERA_PROJECT_ID`: Your Paysera project ID
- `PAYSERA_PASSWORD`: Your Paysera project password
- `PAYSERA_TEST_MODE`: false

### Preview Environment (v0-solis-ftyn8irzweg.vercel.app)

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `NEXT_PUBLIC_SITE_URL`: https://v0-solis-ftyn8irzweg.vercel.app
- `NEXT_PUBLIC_SENTRY_DSN` (optional): Your Sentry DSN
- `PAYSERA_PROJECT_ID`: Your Paysera project ID
- `PAYSERA_PASSWORD`: Your Paysera project password
- `PAYSERA_TEST_MODE`: true (for testing)

## Domain Configuration

1. In the Vercel Dashboard, go to your project settings
2. Under "Domains", add the following:
   - biblioteka.soliopamoka.lt (production)
   - v0-solis-ftyn8irzweg.vercel.app (preview)

3. Configure your DNS settings to point to Vercel:
   - Add a CNAME record for `biblioteka` pointing to `cname.vercel-dns.com`

## Build Settings

The build settings are already configured in vercel.json:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["fra1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,DELETE,PATCH,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    }
  ]
}
```

## Git Integration

Vercel will automatically deploy:
- Preview deployments for all push events and pull requests
- Production deployments when changes are pushed to the main branch

## Troubleshooting

If you encounter any deployment issues:

1. Check the build logs in the Vercel Dashboard
2. Verify that all environment variables are set correctly
3. Make sure your package.json includes the correct build scripts
4. For API routes issues, check the Function Logs in the Vercel Dashboard

## Important Notes

- Environment variables set in the Vercel Dashboard override any values in .env files or vercel.json
- CORS is configured to allow all origins in the current config. For stricter security, update the Access-Control-Allow-Origin header in vercel.json once you've confirmed everything works