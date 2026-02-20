import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import { SubscriptionPlan } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan, stripeCustomerId } = body as {
      plan: SubscriptionPlan
      stripeCustomerId?: string | null
    }

    const validPlans: SubscriptionPlan[] = ['week', 'month', 'three_month']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email!,
      plan,
      stripeCustomerId,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Stripe checkout error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
