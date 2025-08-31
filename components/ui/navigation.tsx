'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
 

export function Navigation() {
  const { user, loading, signOut } = useAuth()
  const { isPremium, isAdmin } = useAuthorization()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  // Show a loading state while auth is being checked
  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  const isAuthenticated = !!user

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center py-4">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0 pr-4 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto md:-ml-6 lg:-ml-8">
              <Logo size="medium" />
            </div>
            <nav className="hidden md:ml-8 lg:ml-10 md:flex md:space-x-4 font-heading">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-xl font-medium ${
                  pathname === '/' 
                    ? 'text-black font-semibold' 
                    : 'text-black hover:text-black'
                }`}
              >
                Pradžia
              </Link>
              {isAuthenticated && (
                <Link 
                  href="/profile" 
                  className={`px-3 py-2 rounded-md text-xl font-medium ${
                    pathname === '/profile' 
                      ? 'text-black font-semibold' 
                      : 'text-black hover:text-black'
                  }`}
                >
                  Profilis
                </Link>
              )}
              {isAdmin() && (
                <Link 
                  href="/manage" 
                  className={`px-3 py-2 rounded-md text-xl font-medium ${
                    pathname.startsWith('/manage') 
                      ? 'text-black font-semibold' 
                      : 'text-black hover:text-black'
                  }`}
                >
                  Valdymas
                </Link>
              )}
            </nav>
          </div>

          {/* Authentication buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {isPremium() && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                    Premium
                  </span>
                )}
                <div className="relative">
                  <Button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    variant="outline"
                  >
                    {user?.email?.split('@')[0] || 'Vartotojas'}
                  </Button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profilis
                      </Link>
                      {isAdmin() && (
                        <>
                          <Link 
                            href="/manage" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Valdymas
                          </Link>
                          <Link 
                            href="/debug/storage-test" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Derinti saugyklą
                          </Link>
                        </>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Atsijungti
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/*
                <Link href="/login">
                  <Button variant="outline">Prisijungti</Button>
                </Link>
                <Link href="/signup">
                  <Button>Registruotis</Button>
                </Link>
                */}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary-navy"
            >
              <span className="sr-only">Atverti pagrindinį meniu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/' 
                  ? 'text-secondary-navy font-semibold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Pradžia
            </Link>
            {isAuthenticated && (
              <Link 
                href="/profile" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/profile' 
                    ? 'text-secondary-navy font-semibold' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Profilis
              </Link>
            )}
            {isAdmin() && (
              <>
                <Link 
                  href="/manage" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname.startsWith('/manage') 
                      ? 'text-secondary-navy font-semibold' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Valdymas
                </Link>
                <Link 
                  href="/debug/storage-test" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname.startsWith('/debug/storage') 
                      ? 'text-secondary-navy font-semibold' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Derinti saugyklą
                </Link>
              </>
            )}
          </div>
          {!isAuthenticated && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5 space-x-3">
                {/*
                <Link 
                  href="/login" 
                  className="block w-full px-4 py-2 text-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Prisijungti
                </Link>
                <Link 
                  href="/signup" 
                  className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-secondary-navy hover:bg-secondary-navy/90 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registruotis
                </Link>
                */}
              </div>
            </div>
          )}
          {isAuthenticated && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-5">
                <div className="text-base font-medium text-gray-800">
                  {user?.email?.split('@')[0] || 'Vartotojas'}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user?.email || ''}
                </div>
                {isPremium() && (
                  <span className="mt-2 inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                    Premium
                  </span>
                )}
              </div>
              <div className="mt-3 px-2 space-y-1">
                {isAdmin() && (
                  <>
                    <Link 
                      href="/manage" 
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Valdymas
                    </Link>
                    <Link 
                      href="/debug/storage-test" 
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Derinti saugyklą
                    </Link>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Atsijungti
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
} 