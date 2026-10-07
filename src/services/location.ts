import { fetchJson } from '../utils/http'
import { loadCachedLocation, saveCachedLocation } from './storage'
import type { GeoCoordinates } from '../types'

interface IpLookupResponse {
  success?: boolean
  city?: string
  latitude?: number | string
  longitude?: number | string
}

const LOCATION_CACHE_MS = 6 * 60 * 60 * 1000
const LOOKUP_TIMEOUT_MS = 6000

// The webview's native fetch is used deliberately: the Rust HTTP client's TLS
// fingerprint gets rejected (403) by some free geolocation APIs.
const IP_PROVIDERS = ['https://ipwho.is/', 'https://get.geojs.io/v1/ip/geo.json']

async function lookupIp(url: string): Promise<GeoCoordinates> {
  const data = (await fetchJson(url, LOOKUP_TIMEOUT_MS)) as IpLookupResponse
  const latitude = Number(data.latitude)
  const longitude = Number(data.longitude)

  if (data.success === false || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Could not determine location from network')
  }
  return { latitude, longitude, city: data.city || 'Your area' }
}

/**
 * Approximates the device location from its public IP address. The result is
 * cached so free lookup services are queried rarely, and a stale cached value
 * is still used when every provider is unreachable or rate limited.
 */
export async function detectAutomaticLocation(): Promise<GeoCoordinates> {
  const cached = await loadCachedLocation()
  if (cached && Date.now() - cached.savedAt < LOCATION_CACHE_MS) return cached

  for (const url of IP_PROVIDERS) {
    try {
      const location = await lookupIp(url)
      void saveCachedLocation(location)
      return location
    } catch {
      // Try the next provider.
    }
  }

  if (cached) return cached
  throw new Error('Location lookup failed')
}
