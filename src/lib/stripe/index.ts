import Stripe from 'stripe'
import { SubscriptionPlan } from '@/types'

// Lazy singleton — avoids throwing at build time when env vars aren't present
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  }
  return _stripe
}

export const STRIPE_PRICE_IDS: Record<SubscriptionPlan, string> = {
  week: process.env.STRIPE_PRICE_WEEK_ID ?? '',
  month: process.env.STRIPE_PRICE_MONTH_ID ?? '',
  three_month: process.env.STRIPE_PRICE_THREE_MONTH_ID ?? '',
}

export async function createCheckoutSession({
  userId,
  userEmail,
  plan,
  stripeCustomerId,
}: {
  userId: string
  userEmail: string
  plan: SubscriptionPlan
  stripeCustomerId?: string | null
}) {
  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId ?? undefined,
    customer_email: stripeCustomerId ? undefined : userEmail,
    line_items: [
      {
        price: STRIPE_PRICE_IDS[plan],
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      plan,
    },
    success_url: `${appUrl}/dashboard?subscription=success`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    subscription_data: {
      metadata: { userId, plan },
    },
  })

  return session
}

export async function createCustomerPortalSession(stripeCustomerId: string) {
  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  })

  return session
}
