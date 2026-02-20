import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuestions } from '@/lib/ai/generate'
import { Difficulty, InterviewRound } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { topic, count = 5, difficulty, round } = body as {
      topic: string
      count?: number
      difficulty?: Difficulty
      round?: InterviewRound
    }

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const safeCount = Math.min(Math.max(1, count), 15) // cap at 15

    // Fetch a few existing questions for style reference
    const { data: existing } = await supabase
      .from('questions')
      .select('title, content')
      .limit(10)

    const questions = await generateQuestions({
      existingQuestions: existing ?? [],
      topic,
      count: safeCount,
      difficulty,
      round,
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('[AI generate error]', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
