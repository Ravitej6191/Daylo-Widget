import clearDay from '../assets/weather/clear-day.svg'
import clearNight from '../assets/weather/clear-night.svg'
import partlyCloudyDay from '../assets/weather/partly-cloudy-day.svg'
import partlyCloudyNight from '../assets/weather/partly-cloudy-night.svg'
import cloudy from '../assets/weather/cloudy.svg'
import fogDay from '../assets/weather/fog-day.svg'
import fogNight from '../assets/weather/fog-night.svg'
import drizzle from '../assets/weather/drizzle.svg'
import rain from '../assets/weather/rain.svg'
import snow from '../assets/weather/snow.svg'
import thunderstorms from '../assets/weather/thunderstorms.svg'
import notAvailable from '../assets/weather/not-available.svg'
import type { WeatherCondition } from '../types'

function iconSrc(condition: WeatherCondition, isNight: boolean): string {
  switch (condition) {
    case 'clear':
      return isNight ? clearNight : clearDay
    case 'partly-cloudy':
      return isNight ? partlyCloudyNight : partlyCloudyDay
    case 'fog':
      return isNight ? fogNight : fogDay
    case 'cloudy':
      return cloudy
    case 'drizzle':
      return drizzle
    case 'rain':
      return rain
    case 'snow':
      return snow
    case 'thunderstorm':
      return thunderstorms
    case 'unknown':
      return notAvailable
  }
}

interface WeatherIconProps {
  condition: WeatherCondition
  isNight: boolean
  size: number
}

export function WeatherIcon({ condition, isNight, size }: WeatherIconProps) {
  return <img src={iconSrc(condition, isNight)} width={size} height={size} alt="" aria-hidden="true" draggable={false} />
}
