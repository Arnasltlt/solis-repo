import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Signup Confirmation | Solis',
  description: 'Verify your email address',
}

export default function SignUpConfirmationPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              Please verify your email address to complete your registration
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>
              We&apos;ve sent a verification link to your email address.
              Please check your inbox and click the link to complete your registration.
            </p>
            <p className="text-sm text-muted-foreground">
              If you don&apos;t see the email, please check your spam folder.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/login">
                Go to Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 