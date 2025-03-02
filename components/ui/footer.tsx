import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Solis. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
} 