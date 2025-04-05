// Force dynamic rendering to avoid static generation issues with cookies
export const dynamic = 'force-dynamic'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 