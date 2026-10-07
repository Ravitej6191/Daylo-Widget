import { useEffect } from 'react'

/** Follows the OS light/dark preference; there is no manual override. */
export function useTheme(): void {
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => root.setAttribute('data-theme', media.matches ? 'dark' : 'light')

    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])
}
