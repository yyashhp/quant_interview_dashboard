'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatPrice } from '@/lib/utils'
import { PLAN_PRICES, PLAN_LABELS, SubscriptionPlan } from '@/types'

interface PricingCardsProps {
  userId?: string
  userEmail?: string
  hasSubscription?: boolean
  stripeCustomerId?: string | null
}

const PLANS: { key: SubscriptionPlan; popular?: boolean; savingsLabel?: string }[] = [
  { key: 'week' },
  { key: 'month', popular: true },
  { key: 'three_month', savingsLabel: 'Save 20%' },
]

export function PricingCards({ userId, userEmail, hasSubscription, stripeCustomerId }: PricingCardsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null)

  async function handleCheckout(plan: SubscriptionPlan) {
    if (!userId) {
      router.push('/signup?redirect=/pricing')
      return
    }

    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId, userEmail, stripeCustomerId }),
      })

      if (!res.ok) throw new Error('Failed to create session')
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setLoading(null)
      alert('Something went wrong. Please try again.')
    }
  }

  async function handleManage() {
    setLoading('month') // just show spinner somewhere
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  if (hasSubscription) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-green-500/30 bg-green-500/5 p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">You&apos;re on Pro</h3>
        <p className="text-sm text-zinc-400 mb-6">
          You have full access to all answers, explanations, and company tags.
        </p>
        <Button variant="outline" onClick={handleManage}>
          Manage subscription
        </Button>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {/* Free tier */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-1">Free</h3>
          <div className="text-3xl font-bold text-white mb-3">$0</div>
          <p className="text-sm text-zinc-500">Browse questions, filter by topic and round.</p>
        </div>
        <ul className="space-y-2 text-sm text-zinc-400 flex-1 mb-6">
          {['Browse all questions', 'Filter by topic & round', 'Bookmark questions', 'Track completion'].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={() => router.push(userId ? '/questions' : '/signup')}>
          {userId ? 'Browse questions' : 'Get started free'}
        </Button>
      </div>

      {/* Paid plans */}
      {PLANS.map(({ key, popular, savingsLabel }) => (
        <div
          key={key}
          className={cn(
            'rounded-2xl border p-6 flex flex-col relative',
            popular
              ? 'border-indigo-500/60 bg-indigo-950/30'
              : 'border-zinc-800 bg-zinc-900/50'
          )}
        >
          {popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                Most Popular
              </span>
            </div>
          )}
          {savingsLabel && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white">
                {savingsLabel}
              </span>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-base font-semibold text-white mb-1">{PLAN_LABELS[key]}</h3>
            <div className="text-3xl font-bold text-white mb-1">
              {formatPrice(PLAN_PRICES[key])}
            </div>
            <p className="text-xs text-zinc-500">
              {key === 'week' ? 'One-time access' : key === 'month' ? 'per month' : 'every 3 months'}
            </p>
          </div>

          <ul className="space-y-2 text-sm text-zinc-300 flex-1 mb-6">
            {[
              'Everything in Free',
              'Full answers to all questions',
              'Detailed explanations',
              'Company tags',
              'AI-generated extra questions',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            onClick={() => handleCheckout(key)}
            loading={loading === key}
            className={cn('gap-2', !popular && 'bg-zinc-700 hover:bg-zinc-600')}
          >
            <Sparkles className="h-4 w-4" />
            Get {PLAN_LABELS[key]}
          </Button>
        </div>
      ))}
    </div>
  )
}
