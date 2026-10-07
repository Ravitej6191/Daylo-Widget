import { useEffect, useRef, useState } from 'react'
import { msUntilNextSecond } from '../utils/format'

/** Ticks once per second using a self-correcting timeout instead of setInterval. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const tick = () => {
      const current = new Date()
      setNow(current)
      timerRef.current = setTimeout(tick, msUntilNextSecond(current))
    }
    timerRef.current = setTimeout(tick, msUntilNextSecond(new Date()))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return now
}
