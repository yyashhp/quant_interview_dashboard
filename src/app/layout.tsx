import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'QuantPrep — Quant Finance Interview Prep',
    template: '%s | QuantPrep',
  },
  description:
    'Practice quant finance interview questions from top firms. Probability, statistics, brainteasers, options pricing, and more.',
  keywords: [
    'quant finance interview',
    'quant trading interview prep',
    'Jane Street interview',
    'Citadel interview questions',
    'Two Sigma interview',
    'probability brainteasers',
    'options pricing interview',
  ],
  openGraph: {
    title: 'QuantPrep — Quant Finance Interview Prep',
    description: 'Practice quant finance interview questions from top firms.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
