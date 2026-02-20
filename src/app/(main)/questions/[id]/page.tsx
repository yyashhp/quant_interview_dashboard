import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bookmark, CheckCircle2, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { PaywallBanner } from '@/components/questions/paywall-banner'
import { ROUND_LABELS, DIFFICULTY_LABELS } from '@/types'
import { cn, DIFFICULTY_COLORS, ROUND_COLORS } from '@/lib/utils'
import { BookmarkToggle } from '@/components/questions/bookmark-toggle'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('questions').select('title, content').eq('id', id).single()
  if (!data) return { title: 'Question Not Found' }
  return {
    title: data.title,
    description: data.content.slice(0, 160),
  }
}

export default async function QuestionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch question with topics
  const { data: question, error } = await supabase
    .from('questions')
    .select(`*, topics:question_topics(topic:topics(*))`)
    .eq('id', id)
    .single()

  if (error || !question) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let hasSubscription = false
  let userProgress = null
  let companies: any[] = []

  if (user) {
    const [{ data: p }, { data: sub }, { data: prog }] = await Promise.all([
      supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
      supabase.from('subscriptions').select('status').eq('user_id', user.id)
        .eq('status', 'active').gt('current_period_end', new Date().toISOString()).maybeSingle(),
      supabase.from('user_progress').select('*').eq('user_id', user.id).eq('question_id', id).maybeSingle(),
    ])
    profile = p
    hasSubscription = !!sub
    userProgress = prog

    if (hasSubscription || profile?.is_admin) {
      const { data: co } = await supabase
        .from('question_companies')
        .select('company:companies(*)')
        .eq('question_id', id)
      companies = (co ?? []).map((c: any) => c.company).filter(Boolean)
    }
  }

  // Fetch answer only if user has access (RLS enforces this server-side too)
  let answer = null
  if (hasSubscription || profile?.is_admin) {
    const { data: ans } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', id)
      .maybeSingle()
    answer = ans
  }

  const topics = question.topics?.map((t: any) => t.topic).filter(Boolean) ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        user={user ? { email: user.email!, is_admin: profile?.is_admin ?? false } : null}
        hasSubscription={hasSubscription}
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Back link */}
        <Link
          href="/questions"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All questions
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={cn('border', DIFFICULTY_COLORS[question.difficulty as keyof typeof DIFFICULTY_COLORS])}>
              {DIFFICULTY_LABELS[question.difficulty as keyof typeof DIFFICULTY_LABELS]}
            </Badge>
            <Badge className={cn('border', ROUND_COLORS[question.round_tag as keyof typeof ROUND_COLORS])}>
              {ROUND_LABELS[question.round_tag as keyof typeof ROUND_LABELS]}
            </Badge>
            {question.is_free && (
              <Badge className="text-green-500 bg-green-500/10 border-green-500/20 border">
                Free
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">{question.title}</h1>

          {/* Topic tags */}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {topics.map((topic: any) => (
                <Link
                  key={topic.id}
                  href={`/questions?topic=${topic.slug}`}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
                >
                  {topic.name}
                </Link>
              ))}
            </div>
          )}

          {/* Progress actions */}
          {user && (
            <BookmarkToggle
              questionId={id}
              userId={user.id}
              initialBookmarked={userProgress?.is_bookmarked ?? false}
              initialCompleted={userProgress?.is_completed ?? false}
            />
          )}
        </div>

        {/* Question content */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
            Question
          </h2>
          <div className="prose-quant">
            {question.content.split('\n').map((line: string, i: number) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        {/* Companies section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
            Asked By
          </h2>
          {hasSubscription || profile?.is_admin ? (
            companies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {companies.map((company: any) => (
                  <div
                    key={company.id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-300"
                  >
                    <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                    {company.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No company data available for this question.</p>
            )
          ) : (
            <PaywallBanner type="company" isLoggedIn={!!user} />
          )}
        </div>

        {/* Answer section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
            Answer
          </h2>
          {hasSubscription || profile?.is_admin ? (
            answer ? (
              <div className="prose-quant">
                {answer.content.split('\n').map((line: string, i: number) => (
                  <p key={i}>{line || <br />}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">Answer coming soon.</p>
            )
          ) : (
            <PaywallBanner type="answer" isLoggedIn={!!user} />
          )}
        </div>

        {/* Explanation section */}
        {(hasSubscription || profile?.is_admin) && answer?.explanation && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
              Explanation
            </h2>
            <div className="prose-quant">
              {answer.explanation.split('\n').map((line: string, i: number) => (
                <p key={i}>{line || <br />}</p>
              ))}
            </div>
          </div>
        )}

        {!hasSubscription && !profile?.is_admin && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
              Explanation
            </h2>
            <PaywallBanner type="explanation" isLoggedIn={!!user} />
          </div>
        )}
      </main>
    </div>
  )
}
