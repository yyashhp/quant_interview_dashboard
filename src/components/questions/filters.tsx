'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, RotateCcw } from 'lucide-react'
import { Topic, Difficulty, InterviewRound } from '@/types'

interface FiltersProps {
  topics: Topic[]
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const ROUND_OPTIONS = [
  { value: 'online_assessment', label: 'Online Assessment' },
  { value: 'first_round', label: 'First Round' },
  { value: 'second_round', label: 'Second Round' },
  { value: 'final_round', label: 'Final Round' },
]

export function QuestionFilters({ topics }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // reset pagination on filter change
      router.push(`/questions?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearFilters = () => {
    router.push('/questions')
  }

  const hasFilters = ['topic', 'difficulty', 'round', 'search'].some((k) =>
    searchParams.has(k)
  )

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search questions..."
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Topic filter */}
      <Select
        placeholder="All Topics"
        value={searchParams.get('topic') ?? ''}
        onChange={(e) => updateFilter('topic', e.target.value)}
        options={topics.map((t) => ({ value: t.slug, label: t.name }))}
        className="w-full sm:w-40"
      />

      {/* Difficulty filter */}
      <Select
        placeholder="Difficulty"
        value={searchParams.get('difficulty') ?? ''}
        onChange={(e) => updateFilter('difficulty', e.target.value)}
        options={DIFFICULTY_OPTIONS}
        className="w-full sm:w-36"
      />

      {/* Round filter */}
      <Select
        placeholder="Round"
        value={searchParams.get('round') ?? ''}
        onChange={(e) => updateFilter('round', e.target.value)}
        options={ROUND_OPTIONS}
        className="w-full sm:w-44"
      />

      {hasFilters && (
        <Button variant="ghost" size="md" onClick={clearFilters} className="shrink-0">
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
