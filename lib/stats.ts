import { DayEntry } from "@/types/quest"
import { localDate } from "@/lib/dates"

export const EMPTY_DAY: DayEntry = { sessions: 0, minutes: 0, xp: 0, quests: 0 }

export function dayEntry(dayLog: Record<string, DayEntry>, date: string): DayEntry {
  return dayLog[date] ?? EMPTY_DAY
}

export function sumLastNDays(
  dayLog: Record<string, DayEntry>,
  n: number
): { minutes: number; sessions: number } {
  let minutes = 0
  let sessions = 0
  for (let i = 0; i < n; i++) {
    const e = dayLog[localDate(new Date(Date.now() - i * 86_400_000))]
    if (e) {
      minutes += e.minutes
      sessions += e.sessions
    }
  }
  return { minutes, sessions }
}

/** "45m" under an hour, "1h 30m" above */
export function fmtMinutes(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/**
 * GitHub-style year grid: array of weeks, each week an array of 7 local
 * dates (YYYY-MM-DD) or null for cells outside the year.
 */
export function yearGrid(year: number): (string | null)[][] {
  const first = new Date(year, 0, 1)
  const last = new Date(year, 11, 31)
  const weeks: (string | null)[][] = []
  // Start on the Sunday on/before Jan 1
  const cursor = new Date(first)
  cursor.setDate(cursor.getDate() - cursor.getDay())
  while (cursor <= last) {
    const week: (string | null)[] = []
    for (let d = 0; d < 7; d++) {
      week.push(cursor.getFullYear() === year ? localDate(cursor) : null)
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}
