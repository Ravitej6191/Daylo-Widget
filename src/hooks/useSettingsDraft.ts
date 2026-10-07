import { useCallback, useEffect, useRef, useState } from 'react'
import { emit } from '@tauri-apps/api/event'
import { enable as enableAutostart, disable as disableAutostart } from '@tauri-apps/plugin-autostart'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../services/storage'
import { SETTINGS_CHANGED_EVENT } from './useSettings'
import { REFRESH_CLAUDE_EVENT } from './useClaudeUsage'
import type { AppSettings } from '../types'

type ApplyState = 'idle' | 'applied' | 'failed'

/** Local, editable copy of settings for the Settings window. Nothing is persisted
 * or reflected on the widget until `apply()` is called. */
export function useSettingsDraft() {
  const [draft, setDraft] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const [applyState, setApplyState] = useState<ApplyState>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    loadSettings().then((loaded) => {
      if (cancelled) return
      setDraft(loaded)
      setSaved(loaded)
      setReady(true)
    })
    return () => {
      cancelled = true
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  const setField = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setApplyState('idle')
  }, [])

  const isDirty = ready && JSON.stringify(draft) !== JSON.stringify(saved)

  const apply = useCallback(async () => {
    let next: ApplyState = 'applied'
    try {
      await saveSettings(draft)
      setSaved(draft)
      await emit(SETTINGS_CHANGED_EVENT)
      if (draft.startWithWindows !== saved.startWithWindows) {
        await (draft.startWithWindows ? enableAutostart() : disableAutostart())
      }
      // Covers both re-enabling the row and pasting a fresh cookie.
      if (draft.claudeEnabled) await emit(REFRESH_CLAUDE_EVENT)
    } catch {
      next = 'failed'
    }
    setApplyState(next)
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setApplyState('idle'), 2500)
  }, [draft, saved.startWithWindows])

  return { draft, saved, setField, apply, isDirty, ready, applyState }
}
