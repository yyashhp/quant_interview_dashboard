'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TrendingUp, Menu, X, ChevronDown } from 'lucide-react'

interface NavbarProps {
  user?: { email: string; is_admin: boolean } | null
  hasSubscription?: boolean
}

const navLinks = [
  { href: '/questions', label: 'Questions' },
  { href: '/topics', label: 'Topics' },
  { href: '/pricing', label: 'Pricing' },
]

export function Navbar({ user, hasSubscription }: NavbarProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg">QuantPrep</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {!hasSubscription && (
                  <Link href="/pricing">
                    <Button size="sm" className="hidden sm:inline-flex">
                      Upgrade
                    </Button>
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.email[0].toUpperCase()}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl py-1">
                      <div className="px-3 py-2 text-xs text-zinc-500 border-b border-zinc-800">
                        {user.email}
                      </div>
                      <Link
                        href="/dashboard"
                        className="block px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      {user.is_admin && (
                        <Link
                          href="/admin"
                          className="block px-3 py-2 text-sm text-indigo-400 hover:bg-zinc-800"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <form action="/api/auth/signout" method="post">
                        <button
                          type="submit"
                          className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          Sign out
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-zinc-800 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}
