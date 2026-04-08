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
        scale: 2,
        backgroundColor: '#1A1A2E',
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`${certificate.certificate_number}.pdf`)
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Link
          href={`/programs/${program.slug}`}
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Program
        </Link>

        {/* Certificate */}
        <div
          ref={certRef}
          className="bg-[#1A1A2E] rounded-3xl p-12 relative overflow-hidden"
          style={{ minHeight: '420px' }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#C9A84C]/5 border border-[#C9A84C]/10" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#C9A84C]/5 border border-[#C9A84C]/10" />
            <div className="absolute top-8 left-8 right-8 bottom-8 border border-[#C9A84C]/10 rounded-2xl pointer-events-none" />
          </div>

          <div className="relative flex flex-col items-center text-center">
            {/* Top badge */}
            <div className="w-14 h-14 rounded-2xl bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center mb-6">
              <span className="text-[#C9A84C] font-bold text-xl">A</span>
            </div>

            <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.3em] mb-2">
              Armah Sports Company
            </p>
            <p className="text-white/40 text-sm mb-8">Certificate of Completion</p>

            <p className="text-white/50 text-sm mb-3">This is to certify that</p>
            <h1 className="text-white text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              {fullName}
            </h1>
            <p className="text-white/50 text-sm mb-3">has successfully completed</p>
            <h2 className="text-[#C9A84C] text-2xl font-bold mb-1">{program.title}</h2>
            <p className="text-white/40 text-sm mb-10">{program.category} · Armah Academy</p>

            {/* Divider */}
            <div className="w-24 h-px bg-[#C9A84C]/30 mb-8" />

            <div className="flex items-center justify-center gap-12 text-center">
              <div>
                <p className="text-white font-semibold text-sm">{issuedDate}</p>
                <p className="text-white/30 text-xs mt-0.5">Date Issued</p>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{certificate.certificate_number}</p>
                <p className="text-white/30 text-xs mt-0.5">Certificate No.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#16213E] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
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
            Download PDF
          </button>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-medium px-6 py-3 rounded-xl text-sm transition-colors"
          >
            View All Certificates
          </Link>
        </div>
      </div>
    </div>
  )
}
