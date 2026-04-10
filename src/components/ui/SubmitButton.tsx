'use client'

import { useFormStatus } from 'react-dom'

interface Props {
  children: React.ReactNode
  loadingText?: string
  className?: string
  style?: React.CSSProperties
  variant?: 'primary' | 'danger' | 'ghost'
}

export default function SubmitButton({ children, loadingText = 'Saving...', className, style, variant = 'primary' }: Props) {
  const { pending } = useFormStatus()

  const baseStyle: React.CSSProperties = style ?? (
    variant === 'primary' ? { background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' } :
    variant === 'danger'  ? { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' } :
    { background: 'rgba(255,255,255,0.08)', color: '#fff' }
  )

  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? 'w-full py-2.5 rounded-xl text-sm font-bold transition-all'}
      style={{ ...baseStyle, opacity: pending ? 0.7 : 1, cursor: pending ? 'not-allowed' : 'pointer' }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingText}
        </span>
      ) : children}
    </button>
  )
}
