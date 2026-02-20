import { Suspense } from 'react'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">QuantPrep</span>
        </Link>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8">
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-zinc-500 mb-6">Sign in to your account to continue</p>
          <Suspense fallback={<div className="h-48 animate-pulse bg-zinc-800 rounded-lg" />}>
            <LoginForm />
          </Suspense>
          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
