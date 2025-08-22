'use client'

import { Metadata } from 'next'
import { ProfileForm } from '@/components/auth/profile-form'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center">
          <div className="mx-auto w-full max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">
              Jūsų profilis
            </h1>
            <ProfileForm />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 