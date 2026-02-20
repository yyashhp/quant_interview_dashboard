import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaywallBannerProps {
  type: 'answer' | 'company' | 'explanation'
  isLoggedIn?: boolean
}

const COPY = {
  answer: {
    title: 'Unlock the Full Answer',
    description:
      'Get access to detailed answers, step-by-step explanations, and company tags for every question.',
  },
  company: {
    title: 'See Which Companies Asked This',
    description:
      'Pro members can see which firms asked each question, helping you target your prep.',
  },
  explanation: {
    title: 'Unlock the Detailed Explanation',
    description:
      'Pro members get a full breakdown of the reasoning, approach, and common mistakes.',
  },
}

export function PaywallBanner({ type, isLoggedIn }: PaywallBannerProps) {
  const copy = COPY[type]

  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-zinc-900 p-6">
      {/* Blur overlay hint */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-zinc-900 to-transparent pointer-events-none" />

      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/20 border border-indigo-500/30">
          <Lock className="h-5 w-5 text-indigo-400" />
        </div>

        <div>
          <h3 className="text-base font-semibold text-white mb-1">{copy.title}</h3>
          <p className="text-sm text-zinc-400 max-w-sm">{copy.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/pricing">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              View Plans
            </Button>
          </Link>
          {!isLoggedIn && (
            <Link href="/signup">
              <Button variant="outline">Create free account</Button>
            </Link>
          )}
        </div>

        <p className="text-xs text-zinc-600">
          Plans from $9.99 · Cancel anytime
        </p>
      </div>
    </div>
  )
}
