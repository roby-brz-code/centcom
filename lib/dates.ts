/** Local calendar date as YYYY-MM-DD */
export function localDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA")
}

export function yesterdayDate(): string {
  return localDate(new Date(Date.now() - 86_400_000))
}
