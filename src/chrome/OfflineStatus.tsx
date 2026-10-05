import { WifiOff } from 'lucide-react'
import { card } from './ui'

/** Says that changes are not reaching other participants. The board itself keeps working. */
export function OfflineStatus() {
  return (
    <div
      role="status"
      title="Changes are saved in this browser and will reach others when the connection is back"
      className={`${card} flex h-11 items-center gap-2 px-4 text-sm text-zinc-500 dark:text-zinc-400`}
    >
      <WifiOff size={15} />
      Offline
    </div>
  )
}
