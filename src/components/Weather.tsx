import { memo } from 'react'
import { CircleDashed } from 'lucide-react'
import { WeatherIcon } from './WeatherIcon'
import { getWeatherLabel } from '../utils/weatherIcons'
import { LAYOUT } from '../utils/layout'
import type { AqiLabel, TemperatureUnit, WeatherData, WeatherStatus } from '../types'

interface WeatherProps {
  data: WeatherData | null
  status: WeatherStatus
  unit: TemperatureUnit
  isNight: boolean
}

const AQI_DOT_COLOR: Record<AqiLabel, string> = {
  Good: '#2ee59d',
  Moderate: '#f5e62a',
  Poor: '#ff4a1c',
}

function WeatherImpl({ data, status, unit, isNight }: WeatherProps) {
  if (!data) {
    return (
      <p
        className="absolute flex items-center gap-2"
        style={{ left: LAYOUT.temperature.left, top: LAYOUT.temperature.top, fontSize: 15, color: 'var(--color-text-secondary)' }}
        aria-live="polite"
      >
        {status === 'error' ? (
          'Weather unavailable'
        ) : (
          <>
            <CircleDashed size={16} className="animate-spin" strokeWidth={1.75} aria-hidden />
            Loading weather…
          </>
        )}
      </p>
    )
  }

  const isStale = status === 'stale'
  const hasRange = data.high !== null && data.low !== null
  const degree = unit === 'fahrenheit' ? '°F' : '°'

  return (
    <div aria-live="polite">
      <div className="absolute" style={{ left: LAYOUT.weatherIcon.left, top: LAYOUT.weatherIcon.top }}>
        <WeatherIcon condition={data.condition} isNight={isNight} size={LAYOUT.weatherIcon.size} />
      </div>

      <p
        className="absolute whitespace-nowrap font-semibold"
        style={{
          left: LAYOUT.temperature.left,
          top: LAYOUT.temperature.top,
          fontSize: LAYOUT.temperature.size,
          lineHeight: 1,
          letterSpacing: '-0.06em',
          color: 'var(--color-text)',
        }}
      >
        {data.temperature}
        {degree}
      </p>

      <div
        aria-hidden
        className="absolute w-px"
        style={{
          left: LAYOUT.divider.left,
          top: LAYOUT.divider.top,
          height: LAYOUT.divider.height,
          background: 'var(--color-text-secondary)',
          opacity: 0.35,
        }}
      />

      <p
        className="absolute whitespace-nowrap"
        style={{
          left: LAYOUT.condition.left,
          top: LAYOUT.condition.top,
          fontSize: LAYOUT.condition.size,
          lineHeight: 1,
          color: 'var(--color-text-secondary)',
        }}
      >
        {getWeatherLabel(data.condition)}
      </p>

      {(hasRange || data.aqiLabel !== null) && (
        <p
          className="absolute flex items-center gap-2 whitespace-nowrap"
          style={{
            left: LAYOUT.highLow.left,
            top: LAYOUT.highLow.top,
            fontSize: LAYOUT.highLow.size,
            lineHeight: 1,
            color: 'var(--color-text-secondary)',
          }}
        >
          {hasRange && (
            <span>
              H: {data.high}
              {degree} &nbsp;L: {data.low}
              {degree}
            </span>
          )}
          {hasRange && data.aqiLabel !== null && <span aria-hidden>|</span>}
          {data.aqiLabel !== null && (
            <span className="flex items-center gap-1.5">
              AQI {data.aqi}
              <span
                aria-hidden
                className="inline-block h-[6px] w-[6px] rounded-full"
                style={{ background: AQI_DOT_COLOR[data.aqiLabel] }}
              />
              {data.aqiLabel}
            </span>
          )}
          {isStale && (
            <span role="img" aria-label="Weather data may be out of date" title="Weather data may be out of date" className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: 'var(--color-text-secondary)', opacity: 0.7 }} />
          )}
        </p>
      )}
    </div>
  )
}

export const Weather = memo(WeatherImpl)
