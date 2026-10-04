import { Check, Link } from 'lucide-react'
import { useEffect, useState } from 'react'
import { keepCanvasFocus } from './ui'

const CONFIRMATION_MS = 2000

/** Copies the board's link, which is all it takes to invite someone, and says so for a moment. */
export function ShareButton() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), CONFIRMATION_MS)
    return () => clearTimeout(timer)
  }, [copied])

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
  }

  return (
    <button
      type="button"
      aria-label="Share"
      title="Copy this board's link"
      onMouseDown={keepCanvasFocus}
      onClick={copyLink}
      className="flex h-8 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-500"
    >
      {copied ? <Check size={15} /> : <Link size={15} />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  )
}
