import { Download } from 'lucide-react'
import type { Engine, ImageFormat } from '../engine/engine'
import { keepCanvasFocus } from './ui'

/** Hands a blob to the browser as a file download. */
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const textButton =
  'flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/10'

/** Downloads the whole scene as a PNG or an SVG. */
export function ExportButtons({ engine }: { engine: Engine }) {
  const exportAs = async (format: ImageFormat) =>
    download(await engine.exportImage(format), `tablo.${format}`)
  return (
    <>
      <button
        type="button"
        aria-label="Export PNG"
        title="Export as PNG"
        onMouseDown={keepCanvasFocus}
        onClick={() => exportAs('png')}
        className={textButton}
      >
        <Download size={15} /> PNG
      </button>
      <button
        type="button"
        aria-label="Export SVG"
        title="Export as SVG"
        onMouseDown={keepCanvasFocus}
        onClick={() => exportAs('svg')}
        className={textButton}
      >
        SVG
      </button>
    </>
  )
}
