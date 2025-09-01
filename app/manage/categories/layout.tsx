import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Temų valdymas | Solis Admin',
  description: 'Temų valdymo puslapis administratoriams',
}

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main>
      {children}
    </main>
  )
} 