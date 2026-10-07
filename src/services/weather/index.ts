import { openMeteoProvider } from './openMeteoProvider'
import type { WeatherProvider } from './provider'

// Swap this to change the weather backend without touching hooks/components.
export const weatherProvider: WeatherProvider = openMeteoProvider
