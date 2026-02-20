import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { QuestionForm } from '@/components/admin/question-form'

export default async function NewQuestionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const [{ data: topics }, { data: companies }] = await Promise.all([
    supabase.from('topics').select('*').order('name'),
    supabase.from('companies').select('*').order('name'),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={{ email: user.email!, is_admin: true }} hasSubscription />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Add New Question</h1>
        <QuestionForm
          topics={topics ?? []}
          companies={companies ?? []}
          userId={user.id}
        />
      </main>
    </div>
  )
}
