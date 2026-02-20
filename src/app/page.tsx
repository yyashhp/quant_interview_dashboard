import Link from 'next/link'
import { ArrowRight, TrendingUp, Brain, Target, Lock, Zap, BarChart3, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'

async function getStats() {
  const supabase = await createClient()
  const [{ count: qCount }, { count: tCount }] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('topics').select('*', { count: 'exact', head: true }),
  ])
  return { questions: qCount ?? 0, topics: tCount ?? 0 }
}

const FEATURES = [
  {
    icon: Brain,
    title: 'Curated by Practitioners',
    description:
      'Questions sourced from real interviews at Jane Street, Citadel, Two Sigma, DE Shaw, and more.',
  },
  {
    icon: Target,
    title: 'Round-Targeted Prep',
    description:
      'Every question is tagged with the interview stage — OA, First Round, or Final Round.',
  },
  {
    icon: BarChart3,
    title: 'Topic Coverage',
    description:
      'Probability, stochastic processes, options pricing, brainteasers, mental math, and more.',
  },
  {
    icon: BookOpen,
    title: 'Detailed Explanations',
    description:
      'Pro members get full answers with step-by-step reasoning and common pitfalls to avoid.',
  },
  {
    icon: Lock,
    title: 'Company Tags',
    description:
      'Know which firms asked which questions. Focus your prep on the companies you\'re targeting.',
  },
  {
    icon: Zap,
    title: 'Always Updated',
    description:
      'New questions added regularly. AI-assisted generation keeps the bank fresh and comprehensive.',
  },
]

const TOPICS = [
  { name: 'Probability', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { name: 'Statistics', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { name: 'Brainteasers', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { name: 'Options Pricing', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { name: 'Stochastic Processes', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { name: 'Mental Math', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { name: 'Linear Algebra', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { name: 'Game Theory', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let hasSubscription = false

  if (user) {
    const [{ data: p }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('is_admin, full_name').eq('id', user.id).single(),
      supabase.from('subscriptions').select('status, current_period_end')
        .eq('user_id', user.id).eq('status', 'active').gt('current_period_end', new Date().toISOString()).maybeSingle(),
    ])
    profile = p
    hasSubscription = !!sub
  }

  const stats = await getStats()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        user={user ? { email: user.email!, is_admin: profile?.is_admin ?? false } : null}
        hasSubscription={hasSubscription}
      />

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400 mb-8">
          <TrendingUp className="h-3.5 w-3.5" />
          The #1 resource for quant finance interview prep
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white max-w-3xl leading-tight mb-6">
          Ace Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Quant Finance
          </span>{' '}
          Interview
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mb-10">
          Practice real interview questions from Jane Street, Citadel, Two Sigma, DE Shaw, and more.
          Covering probability, stochastic processes, options pricing, brainteasers, and every topic
          in between.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href="/questions">
            <Button size="lg" className="gap-2">
              Browse Questions Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pro Plans
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{stats.questions}+</div>
            <div className="text-sm text-zinc-500">Questions</div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div>
            <div className="text-2xl font-bold text-white">{stats.topics}+</div>
            <div className="text-sm text-zinc-500">Topics</div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div>
            <div className="text-2xl font-bold text-white">10+</div>
            <div className="text-sm text-zinc-500">Top Firms</div>
          </div>
        </div>
      </section>

      {/* Topics cloud */}
      <section className="py-16 px-4 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Every Topic You Need</h2>
          <p className="text-zinc-500 mb-8">From mental math to measure theory — we cover it all.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TOPICS.map((topic) => (
              <Link
                key={topic.name}
                href={`/questions?topic=${topic.name.toLowerCase().replace(/\s+/g, '_')}`}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all hover:scale-105 ${topic.color}`}
              >
                {topic.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">
              Everything you need to land the offer
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Built by quants, for quants. Structured to match how elite firms actually interview.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start practicing today
          </h2>
          <p className="text-zinc-400 mb-8">
            Free questions, no credit card required. Upgrade to Pro for answers, explanations,
            and company tags.
          </p>
          <Link href={user ? '/questions' : '/signup'}>
            <Button size="lg">
              {user ? 'Browse Questions' : 'Get Started Free'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600">
              <TrendingUp className="h-3 w-3 text-white" />
            </div>
            <span>QuantPrep</span>
          </div>
          <div className="flex gap-6">
            <Link href="/questions" className="hover:text-zinc-400 transition-colors">Questions</Link>
            <Link href="/pricing" className="hover:text-zinc-400 transition-colors">Pricing</Link>
            <Link href="/topics" className="hover:text-zinc-400 transition-colors">Topics</Link>
          </div>
          <div>© {new Date().getFullYear()} QuantPrep</div>
        </div>
      </footer>
    </div>
  )
}
