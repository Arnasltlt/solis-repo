import { NextResponse } from 'next/server'

/**
 * Dynamic robots.txt generator based on environment
 */
export function GET() {
  // Get the site URL from environment variables, with a fallback
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://biblioteka.soliopamoka.lt'
  
  // In production, allow search engines to crawl public content
  // In other environments, disallow all crawling
  const isProduction = process.env.NODE_ENV === 'production'
  
  const robotsTxt = isProduction 
    ? `# Allow search engines to crawl public content
User-agent: *
Disallow: /api/
Disallow: /manage/
Disallow: /login/
Disallow: /signup/
Disallow: /reset-password/
Disallow: /update-password/
Disallow: /profile/
Disallow: /debug/
Allow: /
Allow: /medziaga/

# Sitemap
Sitemap: ${siteUrl}/sitemap.xml`
    : `# Disallow all crawling in non-production environments
User-agent: *
Disallow: /`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}