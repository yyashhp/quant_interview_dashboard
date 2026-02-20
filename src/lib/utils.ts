import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Difficulty, InterviewRound } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-green-500 bg-green-500/10 border-green-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  hard: 'text-red-500 bg-red-500/10 border-red-500/20',
}

export const ROUND_COLORS: Record<InterviewRound, string> = {
  online_assessment: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  first_round: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  second_round: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  final_round: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
}

export function roundTagFromFilename(filename: string): InterviewRound {
  const lower = filename.toLowerCase()
  if (lower.includes('oa') || lower.includes('online') || lower.includes('assessment')) {
    return 'online_assessment'
  }
  if (lower.includes('final') || lower.includes('superday')) {
    return 'final_round'
  }
  if (lower.includes('second') || lower.includes('round2') || lower.includes('round_2')) {
    return 'second_round'
  }
  return 'first_round'
}
