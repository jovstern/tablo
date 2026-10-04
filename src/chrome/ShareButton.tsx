import { Check, Link, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { keepCanvasFocus } from './ui'

const CONFIRMATION_MS = 2000

type Outcome = 'copied' | 'failed' | null

const LABELS = { copied: 'Link copied', failed: 'Copy failed' }

/** Copies the board's link, which is all it takes to invite someone, and says how that went. */
export function ShareButton() {
  const [outcome, setOutcome] = useState<Outcome>(null)

  useEffect(() => {
    if (!outcome) return
    const timer = setTimeout(() => setOutcome(null), CONFIRMATION_MS)
    return () => clearTimeout(timer)
  }, [outcome])

  const copyLink = async () => {
    try {
      // Missing outside a secure context (plain http on anything but localhost).
      await navigator.clipboard.writeText(window.location.href)
      setOutcome('copied')
    } catch {
      setOutcome('failed')
    }
  }

  const Icon = outcome === 'copied' ? Check : outcome === 'failed' ? TriangleAlert : Link
  return (
    <button
      type="button"
      aria-label="Share"
      title={
        outcome === 'failed'
          ? 'Copy the address from the address bar instead'
          : "Copy this board's link"
      }
      onMouseDown={keepCanvasFocus}
      onClick={copyLink}
      className="flex h-8 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-500"
    >
      <Icon size={15} />
      {outcome ? LABELS[outcome] : 'Share'}
    </button>
  )
}
