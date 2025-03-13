import { EditorStyles } from '../editor-styles'

export default function ContentEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <EditorStyles />
      {children}
    </>
  )
} 