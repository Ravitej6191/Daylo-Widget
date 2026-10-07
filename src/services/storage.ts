import { load, type Store } from '@tauri-apps/plugin-store'
import type { AppSettings, GeoCoordinates, WeatherData } from '../types'

const STORE_FILE = 'settings.json'

let storePromise: Promise<Store> | null = null

function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load(STORE_FILE, { autoSave: true })
  }
  return storePromise
}

export const DEFAULT_SETTINGS: AppSettings = {
  temperatureUnit: 'celsius',
  startWithWindows: false,
  rememberPosition: true,
  claudeEnabled: false,
  claudeCookie: '',
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const store = await getStore()
    const saved = await store.get<Partial<AppSettings>>('settings')
    return { ...DEFAULT_SETTINGS, ...(saved ?? {}) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const store = await getStore()
  await store.set('settings', settings)
  await store.save()
}

interface CachedLocation extends GeoCoordinates {
  savedAt: number
}

export async function loadCachedLocation(): Promise<CachedLocation | null> {
  try {
    const store = await getStore()
    return (await store.get<CachedLocation>('lastLocation')) ?? null
  } catch {
    return null
  }
}

export async function saveCachedLocation(location: GeoCoordinates): Promise<void> {
  try {
    const store = await getStore()
    await store.set('lastLocation', { ...location, savedAt: Date.now() })
  } catch {
    // Cache writes are best-effort.
  }
}

export async function loadCachedWeather(): Promise<WeatherData | null> {
  try {
    const store = await getStore()
    return (await store.get<WeatherData>('lastWeather')) ?? null
  } catch {
    return null
  }
}

export async function saveCachedWeather(data: WeatherData): Promise<void> {
  try {
    const store = await getStore()
    await store.set('lastWeather', data)
  } catch {
    // Cache writes are best-effort.
  }
}
