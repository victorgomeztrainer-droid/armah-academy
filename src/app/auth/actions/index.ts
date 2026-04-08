'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // Check if user is approved
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('id', user.id)
      .single()

    if (!profile?.is_approved) {
      redirect('/pending-approval')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const branch = formData.get('branch') as string

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect('/register?error=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      full_name: fullName,
      branch,
      role: 'trainer',
      is_approved: false,
    })
  }

  redirect('/pending-approval')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
