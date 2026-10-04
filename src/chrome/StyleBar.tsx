import type { ReactNode } from 'react'
import type { Engine } from '../engine/engine'
import { useEngineState } from '../engine/useEngineState'
import { FILLS, NO_FILL, STROKE_COLOURS, STROKE_WIDTHS } from './palette'
import { card, keepCanvasFocus } from './ui'

const checkerboard =
  'bg-[repeating-conic-gradient(#d4d4d8_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]'

type Option<T> = { name: string; value: T }

function Options<T>(props: {
  label: string
  options: Option<T>[]
  current: T | null
  onChoose: (value: T) => void
  className: (option: Option<T>, checked: boolean) => string
  children?: (option: Option<T>) => ReactNode
  style?: (option: Option<T>) => React.CSSProperties
}) {
  return (
    <div role="radiogroup" aria-label={props.label} className="flex items-center gap-1.5">
      {props.options.map((option) => {
        const checked = props.current === option.value
        return (
          <button
            key={option.name}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.name}
            title={option.name}
            onMouseDown={keepCanvasFocus}
            onClick={() => props.onChoose(option.value)}
            className={props.className(option, checked)}
            style={props.style?.(option)}
          >
            {props.children?.(option)}
          </button>
        )
      })}
    </div>
  )
}

const swatch = (option: Option<string>, checked: boolean) =>
  `h-5 w-5 rounded-full border border-black/15 outline-offset-2 ${
    option.value === NO_FILL ? checkerboard : ''
  } ${checked ? 'outline-2 outline-indigo-500' : ''}`

const swatchColour = (option: Option<string>) =>
  option.value === NO_FILL ? {} : { backgroundColor: option.value }

/** Above the tool bar: stroke colour, fill and stroke width for the selection and the next element. */
export function StyleBar({ engine }: { engine: Engine }) {
  const { style } = useEngineState(engine)
  const separator = <span className="h-5 w-px bg-black/10" />
  return (
    <div role="group" aria-label="Style" className={`${card} flex items-center gap-4 px-4 py-2.5`}>
      <Options
        label="Stroke colour"
        options={STROKE_COLOURS}
        current={style.strokeColor}
        onChoose={(strokeColor) => engine.applyStyle({ strokeColor })}
        className={swatch}
        style={swatchColour}
      />
      {separator}
      <Options
        label="Fill"
        options={FILLS}
        current={style.fill}
        onChoose={(fill) => engine.applyStyle({ fill })}
        className={swatch}
        style={swatchColour}
      />
      {separator}
      <Options
        label="Stroke width"
        options={STROKE_WIDTHS}
        current={style.strokeWidth}
        onChoose={(strokeWidth) => engine.applyStyle({ strokeWidth })}
        className={(_, checked) =>
          `grid h-7 w-8 place-items-center rounded-md ${
            checked ? 'bg-indigo-500/15 text-indigo-600' : 'hover:bg-black/5'
          }`
        }
      >
        {(option) => (
          <span
            className="block w-4 rounded-full bg-current"
            style={{ height: option.value + 1 }}
          />
        )}
      </Options>
    </div>
  )
}
