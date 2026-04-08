import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CertificateView from './CertificateView'

export default async function CertificatePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!program) notFound()

  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .eq('program_id', program.id)
    .single()

  if (!cert) redirect(`/programs/${params.slug}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <CertificateView
      certificate={cert}
      program={program}
      fullName={profile?.full_name ?? ''}
    />
  )
}
