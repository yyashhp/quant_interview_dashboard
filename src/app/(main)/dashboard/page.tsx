import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Bookmark, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: sub }, { data: progress }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_progress').select('*, question:questions(id, title, difficulty)').eq('user_id', user.id),
  ])

  const hasSubscription = sub?.status === 'active' && sub?.current_period_end > new Date().toISOString()

  const bookmarked = (progress ?? []).filter((p) => p.is_bookmarked)
  const completed = (progress ?? []).filter((p) => p.is_completed)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        user={{ email: user.email!, is_admin: profile?.is_admin ?? false }}
        hasSubscription={hasSubscription}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-zinc-500 text-sm">{user.email}</p>
        </div>

        {/* Subscription status */}
        <div className={`rounded-xl border p-5 mb-8 ${hasSubscription ? 'border-green-500/30 bg-green-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
          {hasSubscription ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white mb-0.5">Pro Member</div>
                <div className="text-sm text-zinc-400">
                  Access expires {formatDate(sub!.current_period_end)}
                </div>
              </div>
              <Link href="/api/stripe/portal">
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white mb-0.5">Free Account</div>
                <div className="text-sm text-zinc-500">Upgrade to unlock answers, explanations, and company tags</div>
              </div>
              <Link href="/pricing">
                <Button size="sm" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Upgrade
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-zinc-400">Completed</span>
            </div>
            <div className="text-3xl font-bold text-white">{completed.length}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bookmark className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-zinc-400">Bookmarked</span>
            </div>
            <div className="text-3xl font-bold text-white">{bookmarked.length}</div>
          </div>
        </div>

        {/* Bookmarked questions */}
        {bookmarked.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
              Bookmarked Questions
            </h2>
            <div className="space-y-2">
              {bookmarked.slice(0, 5).map((p) => (
                <Link
                  key={p.question_id}
                  href={`/questions/${p.question_id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 hover:border-zinc-600 transition-colors"
                >
                  <span className="text-sm text-zinc-300">{p.question?.title ?? 'Question'}</span>
                  <ArrowRight className="h-4 w-4 text-zinc-600" />
                </Link>
              ))}
            </div>
            {bookmarked.length > 5 && (
              <Link href="/questions" className="text-xs text-indigo-400 mt-3 block">
                View all {bookmarked.length} bookmarks →
              </Link>
            )}
          </div>
        )}

        <Link href="/questions">
          <Button variant="outline" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Browse all questions
          </Button>
        </Link>
      </main>
    </div>
  )
}
