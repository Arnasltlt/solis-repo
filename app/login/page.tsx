import { Metadata } from 'next'
import { SignInForm } from '@/components/auth/sign-in-form'

export const metadata: Metadata = {
  title: 'Login | Solis',
  description: 'Login to your account',
}

export default function LoginPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Login to Your Account
          </h1>
          <SignInForm />
        </div>
      </div>
    </div>
  )
} 