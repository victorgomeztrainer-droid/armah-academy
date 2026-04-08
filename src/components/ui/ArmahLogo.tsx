interface ArmahLogoProps {
  className?: string
  iconOnly?: boolean
  light?: boolean
}

export default function ArmahLogo({ className = '', iconOnly = false, light = false }: ArmahLogoProps) {
  const color = light ? '#1A1A2E' : '#FFFFFF'
  const goldColor = '#C9A84C'

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Armah geometric mark */}
      <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer triangle */}
        <polygon points="50,5 95,85 5,85" stroke={goldColor} strokeWidth="6" fill="none" strokeLinejoin="round"/>
        {/* Inner left diagonal */}
        <line x1="50" y1="5" x2="28" y2="85" stroke={goldColor} strokeWidth="5" strokeLinecap="round"/>
        {/* Inner right diagonal */}
        <line x1="50" y1="5" x2="72" y2="85" stroke={goldColor} strokeWidth="5" strokeLinecap="round"/>
        {/* Cross bar */}
        <line x1="30" y1="58" x2="70" y2="58" stroke={goldColor} strokeWidth="5" strokeLinecap="round"/>
      </svg>

      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span
            className="font-bold tracking-[0.15em] text-sm uppercase"
            style={{ color: light ? '#1A1A2E' : '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
          >
            ARMAH
          </span>
          <span
            className="text-[10px] tracking-[0.2em] font-medium"
            style={{ color: goldColor, letterSpacing: '0.15em' }}
          >
            ACADEMY
          </span>
        </div>
      )}
    </div>
  )
}
