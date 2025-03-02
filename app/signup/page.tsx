import { Metadata } from 'next'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata: Metadata = {
  title: 'Sign Up | Solis',
  description: 'Create a new account',
}

export default function SignUpPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Create an Account
          </h1>
          <SignUpForm />
        </div>
      </div>
    </div>
  )
} 