export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background w-full max-w-none">
      {children}
    </div>
  )
} 