import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kategorijų valdymas | Solis Admin',
  description: 'Kategorijų valdymo puslapis administratoriams',
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