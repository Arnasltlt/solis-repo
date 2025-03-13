import { Metadata } from 'next'
import '@/app/globals.css'
import { EditorStyles } from './editor-styles'

export const metadata: Metadata = {
  title: 'Create New Content | Solis Admin',
  description: 'Create new content for the Solis platform',
}

export default function NewContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <EditorStyles />
    </div>
  )
} 