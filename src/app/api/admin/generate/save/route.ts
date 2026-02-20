import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

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

    const { questions } = await request.json()
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    let savedCount = 0

    for (const q of questions) {
      // Insert question
      const { data: newQ, error: qErr } = await adminSupabase
        .from('questions')
        .insert({
          title: q.title,
          content: q.content,
          difficulty: q.difficulty,
          round_tag: q.round_tag,
          is_free: false,
          source_notes: 'AI Generated',
          created_by: user.id,
        })
        .select('id')
        .single()

      if (qErr || !newQ) continue

      // Insert answer
      if (q.answer) {
        await adminSupabase.from('answers').insert({
          question_id: newQ.id,
          content: q.answer,
          explanation: q.explanation ?? '',
        })
      }

      // Resolve and attach topics
      if (Array.isArray(q.topics) && q.topics.length > 0) {
        for (const topicName of q.topics) {
          const slug = slugify(topicName)

          // Upsert topic
          const { data: topic } = await adminSupabase
            .from('topics')
            .upsert({ name: topicName, slug }, { onConflict: 'slug', ignoreDuplicates: false })
            .select('id')
            .single()

          if (topic) {
            await adminSupabase
              .from('question_topics')
              .insert({ question_id: newQ.id, topic_id: topic.id })
              .throwOnError()
          }
        }
      }

      savedCount++
    }

    return NextResponse.json({ count: savedCount })
  } catch (error) {
    console.error('[Save generated questions error]', error)
    return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 })
  }
}
