import type { WeatherCondition } from '../types'

const LABELS: Record<WeatherCondition, string> = {
  clear: 'Clear sky',
  'partly-cloudy': 'Partly Cloudy',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  drizzle: 'Light Drizzle',
  rain: 'Rainy',
  snow: 'Snowy',
  thunderstorm: 'Thunderstorm',
  unknown: 'Unavailable',
}

export function getWeatherLabel(condition: WeatherCondition): string {
  return LABELS[condition]
}
