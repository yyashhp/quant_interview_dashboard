import Link from 'next/link'
import { Lock, Bookmark, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { QuestionWithRelations, ROUND_LABELS, DIFFICULTY_LABELS } from '@/types'
import { cn, DIFFICULTY_COLORS, ROUND_COLORS } from '@/lib/utils'

interface QuestionCardProps {
  question: QuestionWithRelations
  isBookmarked?: boolean
  isCompleted?: boolean
  hasSubscription?: boolean
}

export function QuestionCard({
  question,
  isBookmarked,
  isCompleted,
  hasSubscription,
}: QuestionCardProps) {
  const isLocked = !question.is_free && !hasSubscription

  return (
    <Link
      href={`/questions/${question.id}`}
      className={cn(
        'group block rounded-xl border bg-zinc-900/50 p-5 transition-all duration-200',
        'hover:border-indigo-500/50 hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-500/5',
        'border-zinc-800',
        isCompleted && 'border-green-500/20 bg-green-500/5'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-2">
            {isCompleted && (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            )}
            {isBookmarked && !isCompleted && (
              <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
            )}
            <h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-white">
              {question.title}
            </h3>
          </div>

          {/* Question preview */}
          <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
            {question.content}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <Badge className={cn('text-xs border', DIFFICULTY_COLORS[question.difficulty])}>
              {DIFFICULTY_LABELS[question.difficulty]}
            </Badge>
            <Badge className={cn('text-xs border', ROUND_COLORS[question.round_tag])}>
              {ROUND_LABELS[question.round_tag]}
            </Badge>
            {question.topics.slice(0, 3).map((topic) => (
              <Badge key={topic.id} variant="outline" className="text-xs">
                {topic.name}
              </Badge>
            ))}
            {question.topics.length > 3 && (
              <Badge variant="outline" className="text-xs text-zinc-500">
                +{question.topics.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Lock indicator */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {isLocked ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-800 rounded-lg px-2 py-1">
              <Lock className="h-3 w-3" />
              <span>Pro</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 rounded-lg px-2 py-1">
              <span>Free</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
