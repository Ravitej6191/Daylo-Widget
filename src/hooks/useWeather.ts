import { useCallback, useEffect, useRef, useState } from 'react'
import { detectAutomaticLocation } from '../services/location'
import { loadCachedWeather, saveCachedWeather } from '../services/storage'
import { weatherProvider } from '../services/weather'
import type { AppSettings, WeatherData, WeatherStatus } from '../types'

const REFRESH_MINUTES = 15

interface UseWeatherResult {
  data: WeatherData | null
  status: WeatherStatus
}

export function useWeather(settings: AppSettings, ready: boolean): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null)
  const [status, setStatus] = useState<WeatherStatus>('idle')
  const requestIdRef = useRef(0)
  const hasDataRef = useRef(false)

  const { temperatureUnit } = settings

  useEffect(() => {
    hasDataRef.current = data !== null
  }, [data])

  useEffect(() => {
    let cancelled = false
    loadCachedWeather().then((cached) => {
      if (!cancelled && cached) setData((prev) => prev ?? cached)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const fetchWeather = useCallback(async () => {
    if (!ready) return
    const requestId = ++requestIdRef.current
    setStatus((prev) => (prev === 'stale' || prev === 'error' ? prev : 'loading'))

    try {
      const coords = await detectAutomaticLocation()
      const weather = await weatherProvider.fetchCurrent({
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: coords.city,
        unit: temperatureUnit,
      })

      if (requestId !== requestIdRef.current) return
      setData(weather)
      setStatus('ready')
      void saveCachedWeather(weather)
    } catch {
      if (requestId !== requestIdRef.current) return
      setStatus(hasDataRef.current ? 'stale' : 'error')
    }
  }, [ready, temperatureUnit])

  useEffect(() => {
    void fetchWeather()
  }, [fetchWeather])

  useEffect(() => {
    if (!ready) return
    const id = setInterval(fetchWeather, REFRESH_MINUTES * 60_000)
    return () => clearInterval(id)
  }, [ready, fetchWeather])

  // Refetch as soon as connectivity returns (e.g. after wake from sleep).
  useEffect(() => {
    const onOnline = () => void fetchWeather()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [fetchWeather])

  return { data, status }
}
