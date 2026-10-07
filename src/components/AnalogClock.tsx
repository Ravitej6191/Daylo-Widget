import { memo } from 'react'

interface AnalogClockProps {
  now: Date
  size?: number
}

const CENTER = 100
const RADIUS = 92
const NUMERALS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i))

function pointOnCircle(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

const TICKS = Array.from({ length: 60 }, (_, i) => {
  const major = i % 5 === 0
  const outer = pointOnCircle(i * 6, RADIUS)
  const inner = pointOnCircle(i * 6, RADIUS - (major ? 9 : 5))
  return { key: i, major, x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y }
})

const NUMERAL_POSITIONS = NUMERALS.map((n, i) => ({ n, ...pointOnCircle(i * 30, RADIUS - 16) }))

function Hand({ angle, length, width, stroke }: { angle: number; length: number; width: number; stroke: string }) {
  const end = pointOnCircle(angle, length)
  return <line x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke={stroke} strokeWidth={width} strokeLinecap="round" />
}

// Decorative; the time is announced by the page-level aria label.
function AnalogClockImpl({ now, size = 148 }: AnalogClockProps) {
  const seconds = now.getSeconds()
  const minutes = now.getMinutes()
  const hourAngle = ((now.getHours() % 12) + minutes / 60) * 30
  const minuteAngle = (minutes + seconds / 60) * 6

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" className="shrink-0">
      {TICKS.map((t) => (
        <line
          key={t.key}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="var(--color-text-secondary)"
          strokeWidth={t.major ? 2 : 1}
          strokeLinecap="round"
          opacity={t.major ? 0.9 : 0.4}
        />
      ))}
      {NUMERAL_POSITIONS.map((p) => (
        <text
          key={p.n}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text)"
          fontSize={15}
          fontWeight={500}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {p.n}
        </text>
      ))}
      <Hand angle={hourAngle} length={44} width={5} stroke="var(--color-text)" />
      <Hand angle={minuteAngle} length={64} width={3.5} stroke="var(--color-text)" />
      <Hand angle={seconds * 6} length={70} width={1.5} stroke="var(--color-accent)" />
      <circle cx={CENTER} cy={CENTER} r={5} fill="var(--color-accent)" stroke="var(--color-text)" strokeWidth={1.5} />
    </svg>
  )
}

export const AnalogClock = memo(AnalogClockImpl)
