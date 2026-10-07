import { memo } from 'react'
import { ClaudeLogo } from './ClaudeLogo'
import { LAYOUT } from '../utils/layout'
import type { ClaudeStatus, ClaudeUsage } from '../types'

interface ClaudeUsageRowProps {
  usage: ClaudeUsage | null
  status: ClaudeStatus
}

const CLAUDE_COLOR = '#D97757'

/** "Resets in 2h 18m" for anything today, a weekday and time beyond that. */
function formatReset(resetsAt: string | null): string {
  if (!resetsAt) return ''
  const target = new Date(resetsAt).getTime()
  if (Number.isNaN(target)) return ''
  const minutes = Math.round((target - Date.now()) / 60_000)
  if (minutes <= 0) return 'Resetting now'
  if (minutes < 60) return `Resets in ${minutes}m`
  if (minutes < 24 * 60) return `Resets in ${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `Resets ${new Date(target).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`
}

function subtitleFor(usage: ClaudeUsage | null, status: ClaudeStatus): string {
  if (status === 'unconfigured') return 'Not connected: add your cookie in Settings'
  if (status === 'error') return usage?.message ?? 'Usage unavailable'
  if (status === 'loading' || !usage?.meters.length) return 'Loading usage…'
  const [session] = usage.meters
  const reset = formatReset(session.resetsAt)
  return `${Math.round(session.pct)}% used${reset ? ` • ${reset}` : ''}`
}

const P = LAYOUT.panel
const BAR = { left: 270, top: 30, width: 83, height: 6 }

function ClaudeUsageRowImpl({ usage, status }: ClaudeUsageRowProps) {
  const session = usage?.meters[0]
  const pct = status === 'ready' && session ? Math.min(Math.max(session.pct, 0), 100) : 0
  const showBar = status === 'ready' && session !== undefined

  return (
    <div
      className="pointer-events-auto absolute rounded-[14px]"
      style={{ left: P.left, top: P.top, width: P.width, height: P.height, background: 'var(--color-hover)', border: '1px solid var(--color-border)' }}
      aria-live="polite"
    >
      <div className="absolute" style={{ left: 14, top: 15 }}>
        <ClaudeLogo size={36} />
      </div>

      <p className="absolute font-semibold whitespace-nowrap" style={{ left: 68, top: 15, fontSize: 15, lineHeight: 1, color: 'var(--color-text)' }}>
        Claude
      </p>
      <p
        className="absolute truncate"
        title={subtitleFor(usage, status)}
        style={{ left: 68, top: 39, width: 215, fontSize: 11.5, lineHeight: 1, color: 'var(--color-text-secondary)' }}
      >
        {subtitleFor(usage, status)}
      </p>

      {showBar && (
        <>
          <div
            className="absolute overflow-hidden rounded-full"
            style={{ left: BAR.left, top: BAR.top, width: BAR.width, height: BAR.height, background: 'rgba(255,255,255,0.15)' }}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Claude session usage"
          >
            <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: CLAUDE_COLOR }} />
          </div>
          <p className="absolute font-semibold tabular-nums" style={{ right: 22, top: 26, fontSize: 15, lineHeight: 1, color: 'var(--color-text)' }}>
            {Math.round(pct)}%
          </p>
        </>
      )}
    </div>
  )
}

export const ClaudeUsageRow = memo(ClaudeUsageRowImpl)
