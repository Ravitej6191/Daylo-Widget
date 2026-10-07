import type { TemperatureUnit, WeatherData } from '../../types'

export interface WeatherRequest {
  latitude: number
  longitude: number
  city: string
  unit: TemperatureUnit
}

export interface WeatherProvider {
  fetchCurrent(request: WeatherRequest): Promise<WeatherData>
}
