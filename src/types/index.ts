export type Difficulty = 'easy' | 'medium' | 'hard'

export type InterviewRound =
  | 'online_assessment'
  | 'first_round'
  | 'second_round'
  | 'final_round'

export type SubscriptionPlan = 'week' | 'month' | 'three_month'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  is_premium: boolean
  created_at: string
}

export interface Topic {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  created_at: string
}

export interface Question {
  id: string
  title: string
  content: string
  difficulty: Difficulty
  round_tag: InterviewRound
  is_free: boolean
  source_notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface QuestionWithRelations extends Question {
  topics: Topic[]
  companies: Company[]
  answer?: Answer | null
}

export interface Answer {
  id: string
  question_id: string
  content: string
  explanation: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_end: string
  created_at: string
}

export interface UserProgress {
  user_id: string
  question_id: string
  is_bookmarked: boolean
  is_completed: boolean
  created_at: string
}

export interface QuestionFilters {
  topic?: string
  company?: string
  difficulty?: Difficulty
  round?: InterviewRound
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}

export const ROUND_LABELS: Record<InterviewRound, string> = {
  online_assessment: 'Online Assessment',
  first_round: 'First Round',
  second_round: 'Second Round',
  final_round: 'Final Round',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  week: '1 Week',
  month: '1 Month',
  three_month: '3 Months',
}

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  week: 999,      // $9.99 in cents
  month: 2499,    // $24.99 in cents
  three_month: 5999, // $59.99 in cents
}
