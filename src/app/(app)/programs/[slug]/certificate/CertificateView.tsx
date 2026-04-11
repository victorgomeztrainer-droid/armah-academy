'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

interface Props {
  certificate: {
    certificate_number: string
    issued_at: string
  }
  program: {
    title: string
    category: string
    slug: string
  }
  fullName: string
}

// Armah geometric mark — recreated from brand identity
const ArmahMark = ({ size = 64, color = '#C9A84C' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer triangle */}
    <polygon points="50,4 96,88 4,88" stroke={color} strokeWidth="4" fill="none" />
    {/* Inner triangle */}
    <polygon points="50,18 84,80 16,80" stroke={color} strokeWidth="2.5" fill="none" />
    {/* Horizontal bars inside */}
    <line x1="29" y1="58" x2="71" y2="58" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <line x1="36" y1="70" x2="64" y2="70" strokeWidth="3" stroke={color} strokeLinecap="round" />
    <line x1="22" y1="46" x2="78" y2="46" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* Center apex dot */}
    <circle cx="50" cy="33" r="2.5" fill={color} />
  </svg>
)

// Ornamental corner SVG
const Corner = ({ flip = false }: { flip?: boolean }) => (
  <svg
    width="80" height="80" viewBox="0 0 80 80" fill="none"
    style={{ transform: flip ? 'scaleX(-1)' : undefined }}
  >
    <path d="M4 4 L4 30 M4 4 L30 4" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 4 L20 20" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.4" />
    <circle cx="4" cy="4" r="3" fill="#C9A84C" />
    <circle cx="30" cy="4" r="1.5" fill="#C9A84C" fillOpacity="0.5" />
    <circle cx="4" cy="30" r="1.5" fill="#C9A84C" fillOpacity="0.5" />
  </svg>
)

export default function CertificateView({ certificate, program, fullName }: Props) {
  const certRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  async function downloadPDF() {
    if (!certRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        backgroundColor: '#0D0D1A',
        useCORS: true,
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 3, canvas.height / 3],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3)
      pdf.save(`${certificate.certificate_number}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#F0F0EC' }}>

      {/* Back link */}
      <div className="w-full max-w-4xl mb-6">
        <Link
          href={`/programs/${program.slug}`}
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Program
        </Link>
      </div>

      {/* ── CERTIFICATE ──────────────────────────────────────── */}
      <div
        ref={certRef}
        className="w-full max-w-4xl relative overflow-hidden select-none"
        style={{
          background: 'linear-gradient(145deg, #0D0D1A 0%, #1A1A2E 50%, #0A0A16 100%)',
          aspectRatio: '1.414 / 1',
          borderRadius: '16px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.15)',
        }}
      >
        {/* ── Background pattern ── */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C9A84C" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* ── Radial gold glow center ── */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />

        {/* ── Ambient blobs ── */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />

        {/* ── Outer gold border ── */}
        <div className="absolute inset-3 rounded-xl pointer-events-none"
          style={{ border: '1px solid rgba(201,168,76,0.25)' }} />
        {/* ── Inner gold border ── */}
        <div className="absolute inset-5 rounded-lg pointer-events-none"
          style={{ border: '1px solid rgba(201,168,76,0.10)' }} />

        {/* ── Corner ornaments ── */}
        <div className="absolute top-4 left-4"><Corner /></div>
        <div className="absolute top-4 right-4"><Corner flip /></div>
        <div className="absolute bottom-4 left-4" style={{ transform: 'scaleY(-1)' }}><Corner /></div>
        <div className="absolute bottom-4 right-4" style={{ transform: 'scale(-1,-1)' }}><Corner /></div>

        {/* ── CONTENT ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-16 py-10 text-center">

          {/* Logo + brand */}
          <div className="flex flex-col items-center mb-4">
            <ArmahMark size={52} />
            <div className="flex items-center gap-3 mt-2">
              <div className="h-px w-8" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <p style={{ color: '#C9A84C', fontSize: '9px', letterSpacing: '0.35em', fontWeight: 700 }}>
                ARMAH SPORTS COMPANY
              </p>
              <div className="h-px w-8" style={{ background: 'rgba(201,168,76,0.3)' }} />
            </div>
          </div>

          {/* Title */}
          <div className="mb-5">
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', letterSpacing: '0.25em', marginBottom: '4px' }}>
              CERTIFICATE OF COMPLETION
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12" style={{ background: 'linear-gradient(to right, transparent, #C9A84C)' }} />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#C9A84C" opacity="0.6">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
              <div className="h-px w-12" style={{ background: 'linear-gradient(to left, transparent, #C9A84C)' }} />
            </div>
          </div>

          {/* Recipient */}
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '0.15em', marginBottom: '8px' }}>
            THIS IS TO CERTIFY THAT
          </p>
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 400,
              letterSpacing: '0.02em',
              lineHeight: 1.1,
              marginBottom: '6px',
              textShadow: '0 0 40px rgba(201,168,76,0.2)',
            }}
          >
            {fullName}
          </h1>
          {/* Gold underline */}
          <div style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)', marginBottom: '14px' }} />

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.15em', marginBottom: '6px' }}>
            HAS SUCCESSFULLY COMPLETED
          </p>
          <h2 style={{
            color: '#C9A84C',
            fontSize: 'clamp(16px, 2.5vw, 22px)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: '3px',
          }}>
            {program.title}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '20px' }}>
            {program.category.toUpperCase()} · ARMAH ACADEMY
          </p>

          {/* Bottom divider + meta */}
          <div className="flex items-center gap-6">
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#FFFFFF', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>{issuedDate}</p>
              <div style={{ height: '1px', background: 'rgba(201,168,76,0.3)', margin: '4px 0' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', letterSpacing: '0.2em' }}>DATE ISSUED</p>
            </div>

            {/* Center seal */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              border: '1.5px solid rgba(201,168,76,0.4)',
              background: 'rgba(201,168,76,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ArmahMark size={28} color="rgba(201,168,76,0.7)" />
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#FFFFFF', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>{certificate.certificate_number}</p>
              <div style={{ height: '1px', background: 'rgba(201,168,76,0.3)', margin: '4px 0' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', letterSpacing: '0.2em' }}>CERTIFICATE NO.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-60 hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#0D0D1A' }}
        >
          {downloading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          {downloading ? 'Generating PDF...' : 'Download Certificate'}
        </button>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-medium px-6 py-3 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          My Certificates
        </Link>
      </div>
    </div>
  )
}
