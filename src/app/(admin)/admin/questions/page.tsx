import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Pencil } from 'lucide-react'
import { DIFFICULTY_COLORS, ROUND_COLORS, formatDate } from '@/lib/utils'
import { DIFFICULTY_LABELS, ROUND_LABELS } from '@/types'
import { cn } from '@/lib/utils'

export default async function AdminQuestionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const { data: questions, count } = await supabase
    .from('questions')
    .select('*, topics:question_topics(topic:topics(name))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={{ email: user.email!, is_admin: true }} hasSubscription />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Questions</h1>
            <p className="text-zinc-500 text-sm">{count ?? 0} total questions</p>
          </div>
          <Link href="/admin/questions/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Question
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 hidden sm:table-cell">Difficulty</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 hidden md:table-cell">Round</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 hidden lg:table-cell">Access</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 hidden lg:table-cell">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {(questions ?? []).map((q: any) => (
                <tr key={q.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-200 truncate max-w-xs">{q.title}</div>
                    <div className="text-xs text-zinc-600 mt-0.5 truncate max-w-xs">
                      {q.topics?.map((t: any) => t.topic?.name).filter(Boolean).join(', ')}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge className={cn('text-xs border', DIFFICULTY_COLORS[q.difficulty as keyof typeof DIFFICULTY_COLORS])}>
                      {DIFFICULTY_LABELS[q.difficulty as keyof typeof DIFFICULTY_LABELS]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge className={cn('text-xs border', ROUND_COLORS[q.round_tag as keyof typeof ROUND_COLORS])}>
                      {ROUND_LABELS[q.round_tag as keyof typeof ROUND_LABELS]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${q.is_free ? 'text-green-400 bg-green-500/10' : 'text-zinc-500 bg-zinc-800'}`}>
                      {q.is_free ? 'Free' : 'Pro'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-zinc-600">
                    {formatDate(q.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/questions/${q.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!questions || questions.length === 0) && (
            <div className="text-center py-16 text-zinc-600">
              No questions yet.{' '}
              <Link href="/admin/questions/new" className="text-indigo-400 hover:underline">
                Add the first one
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
