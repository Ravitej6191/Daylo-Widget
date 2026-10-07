import { fetchJson } from '../../utils/http'
import type { AqiLabel, WeatherCondition } from '../../types'
import type { WeatherProvider, WeatherRequest } from './provider'

interface OpenMeteoResponse {
  current?: { temperature_2m?: number; weather_code?: number }
  daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] }
}

interface AirQualityResponse {
  current?: { european_aqi?: number }
}

// Maps WMO weather codes (https://open-meteo.com/en/docs) to our reduced icon set.
function mapWeatherCode(code: number): WeatherCondition {
  if (code === 0) return 'clear'
  if (code === 1 || code === 2) return 'partly-cloudy'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95 && code <= 99) return 'thunderstorm'
  return 'unknown'
}

function mapAqiLabel(aqi: number): AqiLabel {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  return 'Poor'
}

async function fetchAirQuality(latitude: number, longitude: number): Promise<number | null> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi`
    const { current } = (await fetchJson(url)) as AirQualityResponse
    return typeof current?.european_aqi === 'number' ? Math.round(current.european_aqi) : null
  } catch {
    // Air quality is a bonus reading; its absence shouldn't fail the weather fetch.
    return null
  }
}

export const openMeteoProvider: WeatherProvider = {
  async fetchCurrent({ latitude, longitude, city, unit }: WeatherRequest) {
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=${unit}&timezone=auto`

    const [{ current, daily }, aqi] = await Promise.all([
      fetchJson(forecastUrl) as Promise<OpenMeteoResponse>,
      fetchAirQuality(latitude, longitude),
    ])

    const temperature = current?.temperature_2m
    const code = current?.weather_code

    if (typeof temperature !== 'number' || typeof code !== 'number') {
      throw new Error('Unexpected weather response shape')
    }

    const high = daily?.temperature_2m_max?.[0]
    const low = daily?.temperature_2m_min?.[0]

    return {
      temperature: Math.round(temperature),
      condition: mapWeatherCode(code),
      city,
      fetchedAt: Date.now(),
      high: typeof high === 'number' ? Math.round(high) : null,
      low: typeof low === 'number' ? Math.round(low) : null,
      aqi,
      aqiLabel: aqi === null ? null : mapAqiLabel(aqi),
    }
  },
}
