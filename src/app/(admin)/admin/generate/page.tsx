'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Difficulty, InterviewRound } from '@/types'

interface GeneratedQuestion {
  title: string
  content: string
  difficulty: Difficulty
  round_tag: InterviewRound
  answer: string
  explanation: string
  topics: string[]
}

export default function GenerateQuestionsPage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState('5')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [round, setRound] = useState<InterviewRound | ''>('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedCount, setSavedCount] = useState(0)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setGenerated([])
    setSavedCount(0)

    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          count: parseInt(count),
          difficulty: difficulty || undefined,
          round: round || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Generation failed')
      }

      const data = await res.json()
      setGenerated(data.questions)
      setSelected(new Set(data.questions.map((_: any, i: number) => i)))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const toSave = generated.filter((_, i) => selected.has(i))
      const res = await fetch('/api/admin/generate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: toSave }),
      })

      if (!res.ok) throw new Error('Failed to save questions')
      const { count: saved } = await res.json()
      setSavedCount(saved)
      setGenerated([])
      setSelected(new Set())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleSelect = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">AI Question Generator</h1>
        <p className="text-zinc-500 text-sm">
          Use Claude to generate new questions based on a topic. Review and select which to save.
        </p>
      </div>

      {/* Generate form */}
      <form onSubmit={handleGenerate} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5 mb-8">
        <Input
          id="topic"
          label="Topic *"
          placeholder="e.g. Geometric Brownian Motion, Expected Value, Market Making"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />

        <div className="grid sm:grid-cols-3 gap-4">
          <Select
            id="count"
            label="Number to generate"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            options={['3', '5', '8', '10'].map((v) => ({ value: v, label: v }))}
          />
          <Select
            id="difficulty"
            label="Difficulty (optional)"
            placeholder="Any difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
          <Select
            id="round"
            label="Round (optional)"
            placeholder="Any round"
            value={round}
            onChange={(e) => setRound(e.target.value as InterviewRound | '')}
            options={[
              { value: 'online_assessment', label: 'Online Assessment' },
              { value: 'first_round', label: 'First Round' },
              { value: 'second_round', label: 'Second Round' },
              { value: 'final_round', label: 'Final Round' },
            ]}
          />
        </div>

        <Button type="submit" loading={loading} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {loading ? 'Generating...' : 'Generate Questions'}
        </Button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 mb-6">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {savedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400 mb-6">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedCount} question{savedCount !== 1 ? 's' : ''} saved successfully.
          <button onClick={() => router.push('/admin/questions')} className="underline ml-1">
            View questions
          </button>
        </div>
      )}

      {/* Generated questions list */}
      {generated.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">
              Generated {generated.length} questions — select which to save
            </h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set(generated.map((_, i) => i)))}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
              >
                Deselect all
              </Button>
            </div>
          </div>

          {generated.map((q, i) => (
            <div
              key={i}
              className={`rounded-xl border p-5 cursor-pointer transition-all ${
                selected.has(i)
                  ? 'border-indigo-500/50 bg-indigo-950/20'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
              onClick={() => toggleSelect(i)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center ${
                    selected.has(i)
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-zinc-600'
                  }`}
                >
                  {selected.has(i) && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm mb-1">{q.title}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{q.content}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {q.difficulty}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {q.round_tag.replace(/_/g, ' ')}
                    </span>
                    {q.topics.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            onClick={handleSave}
            loading={saving}
            disabled={selected.size === 0}
            className="w-full"
          >
            Save {selected.size} selected question{selected.size !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  )
}
