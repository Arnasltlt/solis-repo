import { Metadata } from 'next'
import { UpdatePasswordForm } from '@/components/auth/update-password-form'

export const metadata: Metadata = {
  title: 'Update Password | Solis',
  description: 'Update your password',
}

export default function UpdatePasswordPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Update Your Password
          </h1>
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  )
} 