/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'pybqaehxthpxjlboboaq.supabase.co',
      'picsum.photos',
      'placehold.co'
    ],
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
  // Add experimental configuration for server components
  experimental: {
    serverComponentsExternalPackages: ['@supabase/auth-helpers-nextjs', '@supabase/ssr'],
  },
  // Output standalone build for easier deployment
  output: 'standalone'
}

module.exports = nextConfig 