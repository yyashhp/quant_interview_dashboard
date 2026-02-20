import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { ArrowRight } from 'lucide-react'

export default async function TopicsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let hasSubscription = false
  if (user) {
    const [{ data: p }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
      supabase.from('subscriptions').select('status').eq('user_id', user.id)
        .eq('status', 'active').gt('current_period_end', new Date().toISOString()).maybeSingle(),
    ])
    profile = p
    hasSubscription = !!sub
  }

  const { data: topics } = await supabase.from('topics').select('*').order('name')

  // Get question counts per topic
  const { data: counts } = await supabase
    .from('question_topics')
    .select('topic_id')

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    countMap[row.topic_id] = (countMap[row.topic_id] ?? 0) + 1
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        user={user ? { email: user.email!, is_admin: profile?.is_admin ?? false } : null}
        hasSubscription={hasSubscription}
      />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Topics</h1>
          <p className="text-zinc-500 text-sm">Browse questions by topic area</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(topics ?? []).map((topic) => (
            <Link
              key={topic.id}
              href={`/questions?topic=${topic.slug}`}
              className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-600 hover:bg-zinc-900 transition-all"
            >
              <div>
                <div className="font-semibold text-white mb-0.5 group-hover:text-indigo-300 transition-colors">
                  {topic.name}
                </div>
                {topic.description && (
                  <div className="text-xs text-zinc-500 line-clamp-2">{topic.description}</div>
                )}
                <div className="text-xs text-zinc-600 mt-1.5">
                  {countMap[topic.id] ?? 0} question{(countMap[topic.id] ?? 0) !== 1 ? 's' : ''}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>

        {(!topics || topics.length === 0) && (
          <div className="text-center py-20 text-zinc-600">
            <p>No topics yet. Add questions to see topics appear here.</p>
          </div>
        )}
      </main>
    </div>
  )
}
