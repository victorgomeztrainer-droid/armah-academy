'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Use CDN worker matching installed pdfjs-dist version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  pdfUrl: string
  title?: string
  downloadLabel?: string
  startPage?: number   // first page to show (1-based, default = 1)
  endPage?: number     // last page to show (1-based, default = all)
}

export default function PresentationViewer({ pdfUrl, title, downloadLabel, startPage, endPage }: Props) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(startPage ?? 1)
  const [containerWidth, setContainerWidth] = useState(700)
  const [loadError, setLoadError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  // Measure container width for responsive page rendering
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width
      if (w) setContainerWidth(Math.floor(w))
    })
    obs.observe(containerRef.current)
    setContainerWidth(containerRef.current.offsetWidth || 700)
    return () => obs.disconnect()
  }, [])

  // IntersectionObserver — track which page is most visible
  useEffect(() => {
    if (numPages === 0) return
    const observers: IntersectionObserver[] = []

    pageRefs.current.forEach((el, idx) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            setCurrentPage(idx + 1)
          }
        },
        { threshold: 0.4 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [numPages])

  function onDocumentLoadSuccess({ numPages: total }: { numPages: number }) {
    setNumPages(total)
    const effectiveEnd = endPage ? Math.min(endPage, total) : total
    const effectiveStart = startPage ?? 1
    const count = Math.max(0, effectiveEnd - effectiveStart + 1)
    pageRefs.current = new Array(count).fill(null)
  }

  // Visible page range
  const firstPage = startPage ?? 1
  const lastPage = endPage && numPages > 0 ? Math.min(endPage, numPages) : numPages
  const visiblePages = numPages > 0
    ? Array.from({ length: Math.max(0, lastPage - firstPage + 1) }, (_, i) => firstPage + i)
    : []
  const visibleCount = visiblePages.length

  // currentPage is absolute PDF page; slideIndex is 0-based within visible range
  const slideIndex = Math.max(0, currentPage - firstPage)

  function scrollToPage(page: number) {
    const idx = page - firstPage
    const target = pageRefs.current[idx]
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const goToPrev = useCallback(() => {
    if (currentPage > firstPage) scrollToPage(currentPage - 1)
  }, [currentPage, firstPage])

  const goToNext = useCallback(() => {
    if (currentPage < lastPage) scrollToPage(currentPage + 1)
  }, [currentPage, lastPage])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goToNext, goToPrev])

  const pct = visibleCount > 0 ? Math.round(((slideIndex + 1) / visibleCount) * 100) : 0

  return (
    <div className="flex flex-col" style={{ background: '#F0F0EC' }}>

      {/* ── TOP BAR ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 shadow-sm"
        style={{ background: '#1A1A2E', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
      >
        {/* Left — title */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            <svg className="w-4 h-4" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          {title && (
            <span className="text-xs font-semibold text-white/50 truncate hidden sm:block">{title}</span>
          )}
        </div>

        {/* Center — slide counter + progress */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {numPages > 0 ? (
            <>
              <span className="text-xs font-bold tabular-nums" style={{ color: '#C9A84C' }}>
                Slide {slideIndex + 1} <span className="font-normal text-white/30">/ {visibleCount}</span>
              </span>
              <div className="w-32 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-0.5 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C96D)' }}
                />
              </div>
            </>
          ) : (
            <span className="text-xs text-white/30">Loading…</span>
          )}
        </div>

        {/* Right — nav + download */}
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={goToPrev}
            disabled={currentPage <= firstPage}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            title="Previous slide (←)"
          >
            <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next */}
          <button
            onClick={goToNext}
            disabled={currentPage >= lastPage}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            title="Next slide (→)"
          >
            <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Download */}
          <a
            href={pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
            title={downloadLabel ?? 'Download PDF'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">PDF</span>
          </a>
        </div>
      </div>

      {/* ── SLIDES SCROLL AREA ── */}
      <div
        ref={containerRef}
        className="overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 120px)', padding: '24px 16px' }}
      >
        {loadError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <svg className="w-8 h-8" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 mb-1">Could not load PDF</p>
              <p className="text-xs text-gray-400 mb-4">Download it to view on your device</p>
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96D)', color: '#1A1A2E' }}
              >
                Download PDF
              </a>
            </div>
          </div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setLoadError(true)}
            loading={
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <svg className="w-8 h-8 animate-spin" style={{ color: '#C9A84C' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-xs text-gray-400">Loading presentation…</p>
              </div>
            }
          >
            <div className="flex flex-col gap-4 items-center">
              {visiblePages.map((pageNum) => (
                <div
                  key={pageNum}
                  ref={(el) => { pageRefs.current[pageNum - firstPage] = el }}
                  className="relative w-full shadow-lg rounded-xl overflow-hidden"
                  style={{
                    maxWidth: '860px',
                    background: 'white',
                    boxShadow: pageNum === currentPage
                      ? '0 0 0 2px #C9A84C, 0 8px 32px rgba(0,0,0,0.18)'
                      : '0 4px 20px rgba(0,0,0,0.12)',
                    transition: 'box-shadow 0.25s ease',
                  }}
                >
                  <Page
                    pageNumber={pageNum}
                    width={Math.min(containerWidth - 32, 860)}
                    renderAnnotationLayer={true}
                    renderTextLayer={false}
                    loading={
                      <div
                        className="flex items-center justify-center animate-pulse"
                        style={{
                          width: Math.min(containerWidth - 32, 860),
                          height: Math.round(Math.min(containerWidth - 32, 860) * 0.707),
                          background: '#F4F4F0',
                        }}
                      />
                    }
                  />
                  {/* Slide number badge */}
                  <div
                    className="absolute bottom-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md tabular-nums"
                    style={{
                      background: pageNum === currentPage
                        ? 'linear-gradient(135deg, #C9A84C, #E8C96D)'
                        : 'rgba(0,0,0,0.35)',
                      color: pageNum === currentPage ? '#1A1A2E' : 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {pageNum}
                  </div>
                </div>
              ))}
            </div>
          </Document>
        )}
      </div>

      {/* ── BOTTOM MINI NAV ── */}
      {numPages > 0 && (
        <div
          className="flex items-center justify-center gap-3 py-3 px-4"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#EBEBEB' }}
        >
          <button
            onClick={goToPrev}
            disabled={currentPage <= firstPage}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-30 transition-all"
            style={{ background: '#1A1A2E', color: 'white' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>

          <span className="text-xs text-gray-400 font-medium tabular-nums">
            {slideIndex + 1} / {visibleCount}
          </span>

          <button
            onClick={goToNext}
            disabled={currentPage >= lastPage}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-30 transition-all"
            style={{ background: '#1A1A2E', color: 'white' }}
          >
            Next
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
