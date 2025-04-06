import { NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

/**
 * Simplified sitemap generator for search engines
 * For a simpler build process, we're using a static sitemap with just core pages
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://biblioteka.soliopamoka.lt'
  const date = new Date().toISOString()
  
  // Define the content page type
  interface ContentPage {
    url: string;
    lastmod: string;
  }
  
  // Since we can't dynamically fetch content at build time without issues,
  // we'll just include core static pages in the sitemap
  const contentPages: ContentPage[] = []
  
  // Static pages
  const staticPages = [
    { url: siteUrl, lastmod: date },
    { url: `${siteUrl}/login`, lastmod: date },
    { url: `${siteUrl}/signup`, lastmod: date },
  ]
  
  // Combine all pages
  const allPages = [...staticPages, ...contentPages]
  
  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.url === siteUrl ? '1.0' : '0.7'}</priority>
  </url>
  `).join('')}
</urlset>`
  
  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}