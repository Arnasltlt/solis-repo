import { Metadata } from 'next'
import { Suspense } from 'react'
import { ManageLayoutClient } from './manage-layout-client'
import ManageLoading from './loading'

export const metadata: Metadata = {
  title: 'Administravimas | Solis',
  description: 'Solis platformos administravimo skydelis',
}

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<ManageLoading />}>
      <ManageLayoutClient>{children}</ManageLayoutClient>
    </Suspense>
  )
} 