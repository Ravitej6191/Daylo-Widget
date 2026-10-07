import { useCallback, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { ClaudeStatus, ClaudeUsage } from '../types'

export const REFRESH_CLAUDE_EVENT = 'daylo://refresh-claude'

const POLL_MS = 60_000

interface UseClaudeUsageResult {
  usage: ClaudeUsage | null
  status: ClaudeStatus
}

/**
 * Polls the Rust `claude_usage` command. The request runs in the backend so the
 * session cookie never reaches the webview and no CSP exception is needed.
 */
export function useClaudeUsage(enabled: boolean): UseClaudeUsageResult {
  const [usage, setUsage] = useState<ClaudeUsage | null>(null)
  const [status, setStatus] = useState<ClaudeStatus>('loading')
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!enabled) return
    const requestId = ++requestIdRef.current
    try {
      const result = await invoke<ClaudeUsage>('claude_usage')
      if (requestId !== requestIdRef.current) return
      setUsage(result)
      setStatus(result.status)
    } catch {
      if (requestId !== requestIdRef.current) return
      setStatus('error')
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [enabled, refresh])

  // Re-poll when the user changes credentials or asks for a refresh.
  useEffect(() => {
    const unlisten = listen(REFRESH_CLAUDE_EVENT, () => void refresh())
    return () => {
      void unlisten.then((fn) => fn())
    }
  }, [refresh])

  // Turning the row off discards whatever was last fetched.
  return enabled ? { usage, status } : { usage: null, status: 'loading' }
}
