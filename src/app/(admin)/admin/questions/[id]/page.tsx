import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { QuestionForm } from '@/components/admin/question-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditQuestionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const [{ data: question }, { data: topics }, { data: companies }] = await Promise.all([
    supabase.from('questions').select(`
      *,
      topics:question_topics(topic:topics(*)),
      companies:question_companies(company:companies(*)),
      answer:answers(*)
    `).eq('id', id).single(),
    supabase.from('topics').select('*').order('name'),
    supabase.from('companies').select('*').order('name'),
  ])

  if (!question) notFound()

  const normalizedQuestion = {
    ...question,
    topics: question.topics?.map((t: any) => t.topic).filter(Boolean) ?? [],
    companies: question.companies?.map((c: any) => c.company).filter(Boolean) ?? [],
    answer: question.answer?.[0] ?? null,
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={{ email: user.email!, is_admin: true }} hasSubscription />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link
          href="/admin/questions"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to questions
        </Link>
        <h1 className="text-2xl font-bold text-white mb-8">Edit Question</h1>
        <QuestionForm
          topics={topics ?? []}
          companies={companies ?? []}
          userId={user.id}
          question={normalizedQuestion}
        />
      </main>
    </div>
  )
}
