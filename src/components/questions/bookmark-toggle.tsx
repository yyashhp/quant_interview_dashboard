'use client'

import { useState, useTransition } from 'react'
import { Bookmark, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface BookmarkToggleProps {
  questionId: string
  userId: string
  initialBookmarked: boolean
  initialCompleted: boolean
}

export function BookmarkToggle({
  questionId,
  userId,
  initialBookmarked,
  initialCompleted,
}: BookmarkToggleProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [completed, setCompleted] = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()

  const update = async (field: 'is_bookmarked' | 'is_completed', value: boolean) => {
    const supabase = createClient()
    await supabase.from('user_progress').upsert({
      user_id: userId,
      question_id: questionId,
      is_bookmarked: field === 'is_bookmarked' ? value : bookmarked,
      is_completed: field === 'is_completed' ? value : completed,
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          startTransition(async () => {
            const next = !bookmarked
            setBookmarked(next)
            await update('is_bookmarked', next)
          })
        }
        disabled={isPending}
        className={cn('gap-1.5', bookmarked && 'text-yellow-500 hover:text-yellow-400')}
      >
        <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-yellow-500')} />
        {bookmarked ? 'Bookmarked' : 'Bookmark'}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          startTransition(async () => {
            const next = !completed
            setCompleted(next)
            await update('is_completed', next)
          })
        }
        disabled={isPending}
        className={cn('gap-1.5', completed && 'text-green-500 hover:text-green-400')}
      >
        <CheckCircle2 className="h-4 w-4" />
        {completed ? 'Completed' : 'Mark complete'}
      </Button>
    </div>
  )
}
