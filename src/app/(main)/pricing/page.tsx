import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { Check } from 'lucide-react'

const PRO_FEATURES = [
  'Full answers to every question',
  'Detailed step-by-step explanations',
  'Company tags (Jane Street, Citadel, Two Sigma, and more)',
  'All future questions included',
  'Bookmark & track your progress',
  'AI-generated practice questions',
]

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let hasSubscription = false
  let stripeCustomerId: string | null = null

  if (user) {
    const [{ data: p }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
      supabase.from('subscriptions').select('status, stripe_customer_id, current_period_end')
        .eq('user_id', user.id).maybeSingle(),
    ])
    profile = p
    hasSubscription = sub?.status === 'active' && sub?.current_period_end > new Date().toISOString()
    stripeCustomerId = sub?.stripe_customer_id ?? null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        user={user ? { email: user.email!, is_admin: profile?.is_admin ?? false } : null}
        hasSubscription={hasSubscription}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Start for free, unlock everything with Pro. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <PricingCards
          userId={user?.id}
          userEmail={user?.email}
          hasSubscription={hasSubscription}
          stripeCustomerId={stripeCustomerId}
        />

        {/* Pro features list */}
        <div className="mt-16 max-w-md mx-auto">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-6">
            Everything in Pro
          </h3>
          <ul className="space-y-3">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="h-5 w-5 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-indigo-400" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
