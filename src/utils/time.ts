export function formatRaceTime(ms: number | null) {
  if (ms === null || isNaN(ms)) return '--:--.---'
  const totalSecs = ms / 1000
  const mins = Math.floor(totalSecs / 60)
  const secs = Math.floor(totalSecs % 60)
  const remainMs = Math.floor(ms % 1000)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${remainMs.toString().padStart(3, '0')}`
}
