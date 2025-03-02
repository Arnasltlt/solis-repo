import { Metadata } from 'next'
import { PasswordResetForm } from '@/components/auth/password-reset-form'

export const metadata: Metadata = {
  title: 'Reset Password | Solis',
  description: 'Reset your password',
}

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Reset Your Password
          </h1>
          <PasswordResetForm />
        </div>
      </div>
    </div>
  )
} 