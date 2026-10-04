import type { Identity } from '../sync/identity'

const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')

function Avatar({ identity, own }: { identity: Identity; own?: boolean }) {
  const label = own ? `${identity.name} (you)` : identity.name
  return (
    <li
      aria-label={label}
      title={label}
      className={`relative -ml-1.5 grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white ring-2 first:ml-0 ${
        own ? 'ring-indigo-500' : 'ring-white dark:ring-zinc-900'
      }`}
    >
      {/* Filtered like the canvas, so an avatar matches its participant's cursor in both themes. */}
      <span
        className="absolute inset-0 rounded-full [filter:var(--canvas-colour-filter)]"
        style={{ backgroundColor: identity.colour }}
      />
      <span className="relative">{initials(identity.name)}</span>
    </li>
  )
}

type Props = {
  me: Identity
  others: readonly (Identity & { id: string })[]
}

/** Top right: who is on the board. The visitor comes first, marked as themselves. */
export function Participants({ me, others }: Props) {
  return (
    <ul aria-label="Participants" className="pointer-events-auto flex items-center pr-1">
      <Avatar identity={me} own />
      {others.map((other) => (
        <Avatar key={other.id} identity={other} />
      ))}
    </ul>
  )
}
