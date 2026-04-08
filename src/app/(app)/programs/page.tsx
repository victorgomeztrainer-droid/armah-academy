import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const CATEGORY_ICONS: Record<string, string> = {
  'Group Fitness': '🏋️',
  'Recovery & Mobility': '🧘',
  'Combat Fitness': '🥊',
  'Reactive Training': '⚡',
  'Strength & Conditioning': '💪',
  'Strength Training': '🏗️',
  'Mind & Body': '🌿',
  'Nutrition': '🥗',
  'Leadership': '🎯',
}

const DIFFICULTY_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Beginner',     color: '#16A34A', bg: '#F0FDF4' },
  intermediate: { label: 'Intermediate', color: '#D97706', bg: '#FFFBEB' },
  advanced:     { label: 'Advanced',     color: '#DC2626', bg: '#FFF1F2' },
}

// Unique per-program color accent (cycles through palette)
const PROGRAM_ACCENTS = [
  { from: '#C9A84C', to: '#E8C96D' },   // gold (CORE V3)
  { from: '#3B82F6', to: '#60A5FA' },   // blue
  { from: '#8B5CF6', to: '#A78BFA' },   // purple
  { from: '#10B981', to: '#34D399' },   // green
  { from: '#F59E0B', to: '#FCD34D' },   // amber
  { from: '#EC4899', to: '#F472B6' },   // pink
  { from: '#06B6D4', to: '#22D3EE' },   // cyan
  { from: '#EF4444', to: '#F87171' },   // red
  { from: '#84CC16', to: '#A3E635' },   // lime
  { from: '#F97316', to: '#FB923C' },   // orange
  { from: '#6366F1', to: '#818CF8' },   // indigo
  { from: '#14B8A6', to: '#2DD4BF' },   // teal
]

export default async function ProgramsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .order('is_published', { ascending: false })
    .order('created_at', { ascending: true })

  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, module_id, modules(program_id)')

  const { data: progressData } = await supabase
    .from('user_progress')
    .select('lesson_id, completed, lessons(module_id, modules(program_id))')
    .eq('user_id', user!.id)
    .eq('completed', true)

  const { data: certificates } = await supabase
    .from('certificates')
    .select('program_id')
    .eq('user_id', user!.id)

  const certifiedProgramIds = new Set((certificates || []).map((c) => c.program_id))

  function getProgress(programId: string) {
    const total = (allLessons || []).filter((l: any) => l.modules?.program_id === programId).length
    const done = (progressData || []).filter((p: any) => p.lessons?.modules?.program_id === programId).length
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }

  const published = (programs || []).filter((p) => p.is_published)
  const comingSoon = (programs || []).filter((p) => !p.is_published)

  // Featured = first published program (CORE V3)
  const featured = published[0]
  const rest = published.slice(1)

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Programs</h1>
        <p className="text-sm text-gray-400 mt-1">
          {published.length} available · {comingSoon.length} coming soon
        </p>
      </div>

      {/* ── FEATURED PROGRAM (CORE V3) ─────────────────────────────── */}
      {featured && (() => {
        const { total, done, pct } = getProgress(featured.id)
        const certified = certifiedProgramIds.has(featured.id)
        const accent = PROGRAM_ACCENTS[0]
        const diff = DIFFICULTY_LABEL[featured.difficulty] ?? null

        return (
          <Link
            href={`/programs/${featured.slug}`}
            className="group block rounded-3xl overflow-hidden mb-8 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div
              className="relative p-10 md:p-14 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 60%, #16213E 100%)', minHeight: '280px' }}
            >
              {/* Gold glow */}
              <div
                className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 65%)` }}
              />
              {/* Geometric decoration */}
              <svg className="absolute bottom-0 right-0 opacity-[0.04]" width="340" height="240" viewBox="0 0 340 240">
                <polygon points="170,10 330,220 10,220" stroke="#C9A84C" strokeWidth="2" fill="none"/>
                <polygon points="170,40 300,210 40,210" stroke="#C9A84C" strokeWidth="1.5" fill="none"/>
                <polygon points="170,70 270,200 70,200" stroke="#C9A84C" strokeWidth="1" fill="none"/>
              </svg>
              {/* Subtle grid */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, #C9A84C 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #C9A84C 0px, transparent 1px, transparent 40px)' }} />

              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-xl">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0D0D1A' }}
                    >
                      Featured Program
                    </span>
                    {certified && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white">
                        ✓ Certified
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(201,168,76,0.6)' }}>
                    {featured.category}
                  </p>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-none tracking-tight">
                    {featured.title}
                  </h2>
                  {featured.description && (
                    <p className="text-sm leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {featured.description.split('.')[0]}.
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-5 mt-5">
                    {featured.estimated_hours && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {featured.estimated_hours}h
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {total} lessons
                    </div>
                    {diff && (
                      <span className="text-xs font-medium capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {diff.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side — progress + CTA */}
                <div className="flex-shrink-0 min-w-[200px]">
                  {pct > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Progress</span>
                        <span className="font-bold" style={{ color: '#C9A84C' }}>{pct}%</span>
                      </div>
                      <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {done} / {total} lessons complete
                      </p>
                    </div>
                  )}
                  <div
                    className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-2xl text-sm transition-all group-hover:gap-3"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0D0D1A' }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {certified ? 'View Certificate' : pct > 0 ? 'Continue' : 'Start Course'}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )
      })()}

      {/* ── REST OF PUBLISHED PROGRAMS ─────────────────────────────── */}
      {rest.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wider mb-5">More Programs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((program, idx) => {
              const { total, done, pct } = getProgress(program.id)
              const certified = certifiedProgramIds.has(program.id)
              const accent = PROGRAM_ACCENTS[(idx + 1) % PROGRAM_ACCENTS.length]
              const diff = DIFFICULTY_LABEL[program.difficulty] ?? null

              return (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Card thumbnail */}
                  <div className="h-36 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0D0D1A, #1A1A2E)' }}>
                    <div className="absolute inset-0 opacity-20"
                      style={{ background: `radial-gradient(circle at 70% 30%, ${accent.from}, transparent 65%)` }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <span className="text-4xl">{CATEGORY_ICONS[program.category] ?? '📚'}</span>
                    </div>
                    {certified && (
                      <span
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0D0D1A' }}
                      >
                        ✓ Certified
                      </span>
                    )}
                    {pct > 0 && !certified && (
                      <span className="absolute top-3 left-3 text-[10px] font-bold text-white/70 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full uppercase tracking-wider">
                        In Progress
                      </span>
                    )}
                    {diff && (
                      <span
                        className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                        style={{ background: diff.bg, color: diff.color }}
                      >
                        {diff.label}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(26,26,46,0.35)' }}>
                      {program.category}
                    </p>
                    <h3 className="font-bold text-[#1A1A2E] text-base mb-2 group-hover:text-[#C9A84C] transition-colors leading-tight">
                      {program.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                      {total > 0 && <span>{total} lessons</span>}
                      {program.estimated_hours && <span>{program.estimated_hours}h</span>}
                    </div>

                    {pct > 0 ? (
                      <>
                        <div className="w-full bg-gray-100 rounded-full h-1">
                          <div
                            className="h-1 rounded-full"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">{pct}% complete</p>
                      </>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold group-hover:gap-2.5 transition-all"
                        style={{ color: accent.from }}
                      >
                        Start course
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── COMING SOON ────────────────────────────────────────────── */}
      {comingSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wider">Coming Soon</h2>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">{comingSoon.length} programs</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comingSoon.map((program, idx) => {
              const accent = PROGRAM_ACCENTS[(idx + published.length) % PROGRAM_ACCENTS.length]
              return (
                <div
                  key={program.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden relative opacity-70"
                >
                  <div className="h-32 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0D0D1A, #1A1A2E)' }}>
                    <div className="absolute inset-0 opacity-10"
                      style={{ background: `radial-gradient(circle at 60% 40%, ${accent.from}, transparent 65%)` }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl opacity-30">{CATEGORY_ICONS[program.category] ?? '📚'}</span>
                    </div>
                    {/* Coming soon pill */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white/60 border border-white/15 bg-white/5 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-300">{program.category}</p>
                    <h3 className="font-bold text-gray-400 text-sm leading-tight mb-1">{program.title}</h3>
                    {program.estimated_hours && (
                      <p className="text-xs text-gray-300">{program.estimated_hours}h · {program.difficulty}</p>
                    )}
                  </div>
                  {/* Lock */}
                  <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
