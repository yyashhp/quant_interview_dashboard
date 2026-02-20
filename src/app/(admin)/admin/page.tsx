import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { PlusCircle, Sparkles, BookOpen, Building2, Tag, Users } from 'lucide-react'

async function getAdminStats() {
  const supabase = await createClient()
  const [
    { count: qCount },
    { count: tCount },
    { count: cCount },
    { count: uCount },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('topics').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])
  return { questions: qCount ?? 0, topics: tCount ?? 0, companies: cCount ?? 0, users: uCount ?? 0 }
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const stats = await getAdminStats()

  const STAT_CARDS = [
    { label: 'Questions', value: stats.questions, icon: BookOpen, href: '/admin/questions' },
    { label: 'Topics', value: stats.topics, icon: Tag, href: '/admin/topics' },
    { label: 'Companies', value: stats.companies, icon: Building2, href: '/admin/companies' },
    { label: 'Users', value: stats.users, icon: Users, href: '/admin/users' },
  ]

  const QUICK_ACTIONS = [
    { label: 'Add Question', icon: PlusCircle, href: '/admin/questions/new', desc: 'Manually add a new interview question' },
    { label: 'Generate with AI', icon: Sparkles, href: '/admin/generate', desc: 'Use Claude to generate questions by topic' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={{ email: user.email!, is_admin: true }} hasSubscription />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm">Manage questions, topics, and companies</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {STAT_CARDS.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-600 transition-colors"
            >
              <card.icon className="h-5 w-5 text-zinc-500 mb-3" />
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-sm text-zinc-500">{card.label}</div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-indigo-500/40 hover:bg-zinc-900 transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <action.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm mb-0.5">{action.label}</div>
                <div className="text-xs text-zinc-500">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
