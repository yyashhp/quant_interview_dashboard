import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { QuestionCard } from '@/components/questions/question-card'
import { QuestionFilters } from '@/components/questions/filters'
import { QuestionWithRelations, Difficulty, InterviewRound } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 20

interface SearchParams {
  topic?: string
  difficulty?: Difficulty
  round?: InterviewRound
  search?: string
  page?: string
}

async function getQuestions(params: SearchParams, userId?: string) {
  const supabase = await createClient()
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('questions')
    .select(
      `*, topics:question_topics(topic:topics(*)), companies:question_companies(company:companies(*))`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.difficulty) query = query.eq('difficulty', params.difficulty)
  if (params.round) query = query.eq('round_tag', params.round)
  if (params.search) query = query.textSearch('search_vector', params.search)
  if (params.topic) {
    // Filter via junction — need subquery approach
    const { data: topicData } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', params.topic)
      .single()

    if (topicData) {
      const { data: qIds } = await supabase
        .from('question_topics')
        .select('question_id')
        .eq('topic_id', topicData.id)

      const ids = (qIds ?? []).map((r) => r.question_id)
      if (ids.length === 0) return { data: [], count: 0, page }
      query = query.in('id', ids)
    }
  }

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  // Flatten junction table structure
  const questions: QuestionWithRelations[] = (data ?? []).map((q: any) => ({
    ...q,
    topics: q.topics?.map((t: any) => t.topic).filter(Boolean) ?? [],
    companies: q.companies?.map((c: any) => c.company).filter(Boolean) ?? [],
  }))

  return { data: questions, count: count ?? 0, page }
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let hasSubscription = false
  let progress: Record<string, { is_bookmarked: boolean; is_completed: boolean }> = {}

  if (user) {
    const [{ data: p }, { data: sub }, { data: prog }] = await Promise.all([
      supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
      supabase.from('subscriptions').select('status').eq('user_id', user.id)
        .eq('status', 'active').gt('current_period_end', new Date().toISOString()).maybeSingle(),
      supabase.from('user_progress').select('question_id, is_bookmarked, is_completed').eq('user_id', user.id),
    ])
    profile = p
    hasSubscription = !!sub
    progress = Object.fromEntries((prog ?? []).map((r) => [r.question_id, r]))
  }

  const { data: topics } = await supabase.from('topics').select('*').order('name')
  const { data: questions, count, page } = await getQuestions(params, user?.id)
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        user={user ? { email: user.email!, is_admin: profile?.is_admin ?? false } : null}
        hasSubscription={hasSubscription}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Interview Questions</h1>
          <p className="text-zinc-500 text-sm">
            {count} question{count !== 1 ? 's' : ''} · filter by topic, difficulty, or round
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Suspense>
            <QuestionFilters topics={topics ?? []} />
          </Suspense>
        </div>

        {/* Question list */}
        {questions.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-lg font-medium mb-2">No questions found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                isBookmarked={progress[question.id]?.is_bookmarked}
                isCompleted={progress[question.id]?.is_completed}
                hasSubscription={hasSubscription}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={`/questions?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Link>
            )}
            <span className="text-sm text-zinc-500 px-2">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/questions?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
