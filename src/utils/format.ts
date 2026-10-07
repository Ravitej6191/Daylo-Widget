export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function msUntilNextSecond(date: Date): number {
  return 1000 - date.getMilliseconds()
}

export function truncateCity(city: string, maxLength = 22): string {
  if (city.length <= maxLength) return city
  return `${city.slice(0, maxLength - 1)}…`
}
