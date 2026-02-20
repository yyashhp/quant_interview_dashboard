import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// App Router reads the raw body via request.text() natively — no config needed
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('[Stripe webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (!userId || !plan || !session.subscription) break

        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        ) as unknown as Stripe.Subscription & { current_period_end: number }

        const periodEnd = subscription.current_period_end
          ?? subscription.items?.data?.[0]?.current_period_end

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          plan,
          status: subscription.status,
          current_period_end: new Date((periodEnd ?? 0) * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' })

        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number }
        const userId = subscription.metadata?.userId

        if (!userId) break

        const periodEnd = subscription.current_period_end
          ?? (subscription.items?.data?.[0] as any)?.current_period_end

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date((periodEnd ?? 0) * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (error) {
    console.error('[Stripe webhook] Handler error:', error)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
