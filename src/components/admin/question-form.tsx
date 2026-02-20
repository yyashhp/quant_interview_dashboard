'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Topic, Company, Difficulty, InterviewRound } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface QuestionFormProps {
  topics: Topic[]
  companies: Company[]
  userId: string
  question?: {
    id: string
    title: string
    content: string
    difficulty: Difficulty
    round_tag: InterviewRound
    is_free: boolean
    source_notes: string | null
    topics: Topic[]
    companies: Company[]
    answer?: { content: string; explanation: string } | null
  }
}

export function QuestionForm({ topics, companies, userId, question }: QuestionFormProps) {
  const router = useRouter()
  const isEditing = !!question

  const [title, setTitle] = useState(question?.title ?? '')
  const [content, setContent] = useState(question?.content ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? 'medium')
  const [roundTag, setRoundTag] = useState<InterviewRound>(question?.round_tag ?? 'first_round')
  const [isFree, setIsFree] = useState(question?.is_free ?? false)
  const [sourceNotes, setSourceNotes] = useState(question?.source_notes ?? '')
  const [answerContent, setAnswerContent] = useState(question?.answer?.content ?? '')
  const [explanation, setExplanation] = useState(question?.answer?.explanation ?? '')
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    question?.topics.map((t) => t.id) ?? []
  )
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    question?.companies.map((c) => c.id) ?? []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleTopic = (id: string) =>
    setSelectedTopics((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleCompany = (id: string) =>
    setSelectedCompanies((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Title and question content are required.')
      return
    }

    setSaving(true)
    setError('')
    const supabase = createClient()

    try {
      let questionId = question?.id

      if (isEditing) {
        const { error: qErr } = await supabase
          .from('questions')
          .update({ title, content, difficulty, round_tag: roundTag, is_free: isFree, source_notes: sourceNotes || null })
          .eq('id', questionId!)
        if (qErr) throw qErr
      } else {
        const { data: newQ, error: qErr } = await supabase
          .from('questions')
          .insert({ title, content, difficulty, round_tag: roundTag, is_free: isFree, source_notes: sourceNotes || null, created_by: userId })
          .select('id')
          .single()
        if (qErr) throw qErr
        questionId = newQ.id
      }

      // Update topic associations
      await supabase.from('question_topics').delete().eq('question_id', questionId!)
      if (selectedTopics.length > 0) {
        await supabase.from('question_topics').insert(
          selectedTopics.map((tid) => ({ question_id: questionId!, topic_id: tid }))
        )
      }

      // Update company associations
      await supabase.from('question_companies').delete().eq('question_id', questionId!)
      if (selectedCompanies.length > 0) {
        await supabase.from('question_companies').insert(
          selectedCompanies.map((cid) => ({ question_id: questionId!, company_id: cid }))
        )
      }

      // Upsert answer
      if (answerContent.trim()) {
        await supabase.from('answers').upsert({
          question_id: questionId!,
          content: answerContent,
          explanation: explanation || '',
        }, { onConflict: 'question_id' })
      }

      router.push('/admin/questions')
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'An error occurred')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!question?.id || !confirm('Delete this question? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('questions').delete().eq('id', question.id)
    router.push('/admin/questions')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic fields */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Question Details</h2>

        <Input
          id="title"
          label="Title *"
          placeholder="e.g. Expected value of a dice roll"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Question Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the full question as it would be asked in an interview..."
            rows={5}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
            required
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Select
            id="difficulty"
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
          <Select
            id="round"
            label="Interview Round"
            value={roundTag}
            onChange={(e) => setRoundTag(e.target.value as InterviewRound)}
            options={[
              { value: 'online_assessment', label: 'Online Assessment' },
              { value: 'first_round', label: 'First Round' },
              { value: 'second_round', label: 'Second Round' },
              { value: 'final_round', label: 'Final Round' },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Access</label>
            <button
              type="button"
              onClick={() => setIsFree((v) => !v)}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                isFree
                  ? 'border-green-500/40 bg-green-500/10 text-green-400'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
              )}
            >
              {isFree ? 'Free Question' : 'Pro Only'}
            </button>
          </div>
        </div>

        <Input
          id="source"
          label="Source Notes (internal only)"
          placeholder="e.g. From Jane Street OA 2023"
          value={sourceNotes}
          onChange={(e) => setSourceNotes(e.target.value)}
        />
      </div>

      {/* Topics */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Topics</h2>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => toggleTopic(topic.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                selectedTopics.includes(topic.id)
                  ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-300'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
              )}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>

      {/* Companies */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Companies</h2>
        <div className="flex flex-wrap gap-2">
          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => toggleCompany(company.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                selectedCompanies.includes(company.id)
                  ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-300'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
              )}
            >
              {company.name}
            </button>
          ))}
        </div>
      </div>

      {/* Answer & Explanation */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Answer & Explanation (Pro)</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Answer</label>
          <textarea
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="The correct answer..."
            rows={4}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Explanation</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Detailed step-by-step explanation, common mistakes, key insights..."
            rows={6}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>
          {isEditing ? 'Save Changes' : 'Create Question'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="danger"
            className="ml-auto"
            onClick={handleDelete}
          >
            Delete Question
          </Button>
        )}
      </div>
    </form>
  )
}
