// PROTOTYPE: three variants of tablo's chrome over the Excalidraw canvas, switchable via ?variant=A|B|C.
// Question: what should the chrome look like (layout, density, palette)? Also: can it drive the engine with its UI hidden?
import { Excalidraw, FONT_FAMILY } from '@excalidraw/excalidraw'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useEngine } from './useEngine'
import * as A from './VariantA'
import * as B from './VariantB'
import * as C from './VariantC'

const UI_OPTIONS = { tools: { image: false } }
const INITIAL_DATA = {
  appState: {
    currentItemRoughness: 0,
    currentItemStrokeWidth: 2,
    currentItemFillStyle: 'solid' as const,
    currentItemFontFamily: FONT_FAMILY.Helvetica,
    currentItemRoundness: 'round' as const,
  },
}

const VARIANTS = ['A', 'B', 'C'] as const
type V = (typeof VARIANTS)[number]
const NAMES: Record<V, string> = { A: A.name, B: B.name, C: C.name }
const INSETS: Record<V, { left?: number; top?: number }> = { A: {}, B: B.inset, C: C.inset }

export function ChromePrototype() {
  const e = useEngine()
  const read = () => (new URLSearchParams(location.search).get('variant') as V) ?? 'A'
  const [variant, setVariant] = useState<V>(VARIANTS.includes(read()) ? read() : 'A')
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)

  const cycle = (d: number) => {
    const next = VARIANTS[(VARIANTS.indexOf(variant) + d + VARIANTS.length) % VARIANTS.length]
    history.replaceState(null, '', `?variant=${next}`)
    setVariant(next)
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable]') || !ev.altKey) return
      if (ev.key === 'ArrowLeft') cycle(-1)
      if (ev.key === 'ArrowRight') cycle(1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  const props = { e, dark, toggleDark: () => setDark((d) => !d) }
  const inset = INSETS[variant]

  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-zinc-950">
      <div className="absolute inset-0" style={{ left: inset.left ?? 0, top: inset.top ?? 0 }}>
        <Excalidraw
          excalidrawAPI={e.setApi}
          theme={dark ? 'dark' : 'light'}
          UIOptions={UI_OPTIONS}
          initialData={INITIAL_DATA}
        />
      </div>
      {variant === 'A' && <A.VariantA {...props} />}
      {variant === 'B' && <B.VariantB {...props} />}
      {variant === 'C' && <C.VariantC {...props} />}

      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full bg-fuchsia-600 px-1 py-1 font-mono text-xs text-white shadow-xl">
          <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/20" onClick={() => cycle(-1)} aria-label="Previous variant"><ChevronLeft size={14} /></button>
          <span className="px-1">{variant} ({NAMES[variant]}) · {e.count} el · {e.tool}</span>
          <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/20" onClick={() => cycle(1)} aria-label="Next variant"><ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  )
}
