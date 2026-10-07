import { useEffect, type MouseEvent } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { Settings as SettingsIcon } from 'lucide-react'
import { Weather } from './Weather'
import { AnalogClock } from './AnalogClock'
import { ClaudeUsageRow } from './ClaudeUsageRow'
import { useClock } from '../hooks/useClock'
import { useSettings } from '../hooks/useSettings'
import { useWeather } from '../hooks/useWeather'
import { useClaudeUsage } from '../hooks/useClaudeUsage'
import { useTheme } from '../hooks/useTheme'
import { formatDate, truncateCity } from '../utils/format'
import { CARD, LAYOUT, SCALE } from '../utils/layout'

// The widget is a display-only surface: no context menu, no right-click actions.
// Every control lives in the Settings window.
const blockContextMenu = (event: MouseEvent) => event.preventDefault()

const openSettings = () => {
  invoke('show_settings_window').catch(() => {})
}

export function WidgetApp() {
  const now = useClock()
  const { settings, ready } = useSettings()
  const { data: weather, status } = useWeather(settings, ready)
  const { usage: claudeUsage, status: claudeStatus } = useClaudeUsage(settings.claudeEnabled)
  useTheme()

  useEffect(() => {
    if (!ready) return
    void getCurrentWindow().setSize(new LogicalSize(Math.round(CARD.width * SCALE), Math.round(CARD.height * SCALE))).catch(() => {})
  }, [ready])

  const city = weather?.city ?? (status === 'error' ? '' : 'Locating…')

  return (
    <div data-tauri-drag-region onContextMenu={blockContextMenu} className="relative h-screen w-screen overflow-hidden">
    <div
      data-tauri-drag-region
      className="group absolute left-0 top-0 overflow-hidden rounded-[28px]"
      style={{
        width: CARD.width,
        height: CARD.height,
        zoom: SCALE,
        background: 'linear-gradient(160deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.03) 45%, rgba(12,13,16,0.55) 100%), rgba(16,17,20,0.78)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <p
        className="absolute truncate font-semibold"
        style={{
          left: LAYOUT.headline.left,
          top: LAYOUT.headline.top,
          fontSize: LAYOUT.headline.size,
          lineHeight: 1,
          color: 'var(--color-text)',
          maxWidth: LAYOUT.panel.width,
        }}
      >
        {truncateCity(city, 24)}
      </p>

      <p
        className="absolute whitespace-nowrap"
        style={{
          left: LAYOUT.date.left,
          top: LAYOUT.date.top,
          fontSize: LAYOUT.date.size,
          lineHeight: 1,
          color: 'var(--color-text-secondary)',
        }}
      >
        {formatDate(now)}
      </p>

      <Weather data={weather} status={status} unit={settings.temperatureUnit} isNight={now.getHours() < 6 || now.getHours() >= 18} />

      {settings.claudeEnabled && <ClaudeUsageRow usage={claudeUsage} status={claudeStatus} />}

      <div className="absolute" style={{ left: LAYOUT.clock.left, top: LAYOUT.clock.top }}>
        <AnalogClock now={now} size={LAYOUT.clock.size} />
      </div>

      <button
        type="button"
        aria-label="Open settings"
        onClick={openSettings}
        className="absolute z-10 flex items-center justify-center rounded-full border opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[var(--color-hover)]"
        style={{
          left: LAYOUT.settingsButton.left,
          top: LAYOUT.settingsButton.top,
          width: LAYOUT.settingsButton.size,
          height: LAYOUT.settingsButton.size,
          color: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <SettingsIcon size={20} strokeWidth={1.75} />
      </button>
    </div>
    </div>
  )
}
