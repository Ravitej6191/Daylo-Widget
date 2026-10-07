const DEFAULT_TIMEOUT_MS = 8000

/** JSON GET with a timeout. Throws on network failure, timeout, or non-2xx status. */
export async function fetchJson(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}
