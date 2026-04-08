import { redirect } from 'next/navigation'

// Quiz is now program-level — redirect old per-module quiz URLs
export default function OldModuleQuizRedirect({
  params,
}: {
  params: { slug: string; moduleId: string }
}) {
  redirect(`/programs/${params.slug}/quiz`)
}
