export type TemperatureUnit = 'celsius' | 'fahrenheit'

export interface AppSettings {
  temperatureUnit: TemperatureUnit
  startWithWindows: boolean
  rememberPosition: boolean
  claudeEnabled: boolean
  claudeCookie: string
}

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown'

export type AqiLabel = 'Good' | 'Moderate' | 'Poor'

export interface WeatherData {
  temperature: number
  condition: WeatherCondition
  city: string
  fetchedAt: number
  high: number | null
  low: number | null
  aqi: number | null
  aqiLabel: AqiLabel | null
}

export type WeatherStatus = 'idle' | 'loading' | 'ready' | 'stale' | 'error'

export interface GeoCoordinates {
  latitude: number
  longitude: number
  city: string
}

export type ClaudeStatus = 'loading' | 'ready' | 'unconfigured' | 'error'

interface ClaudeMeter {
  label: string
  pct: number
  resetsAt: string | null
}

export interface ClaudeUsage {
  status: Exclude<ClaudeStatus, 'loading'>
  message: string | null
  meters: ClaudeMeter[]
  fetchedAt: number
}
