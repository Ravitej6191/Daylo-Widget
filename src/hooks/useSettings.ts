import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { loadSettings, DEFAULT_SETTINGS } from '../services/storage'
import type { AppSettings } from '../types'

export const SETTINGS_CHANGED_EVENT = 'daylo://settings-changed'

/** Read-only view of the persisted settings that stays in sync with the Settings window. */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadSettings().then((loaded) => {
      if (cancelled) return
      setSettings(loaded)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const unlisten = listen(SETTINGS_CHANGED_EVENT, () => {
      loadSettings().then(setSettings)
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  return { settings, ready }
}
