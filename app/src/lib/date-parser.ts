export function parseDateFlexible(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr
  
  const s = String(dateStr).trim()
  if (!s) return null

  // 1. Format ISO direct : YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    const date = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0)
    return isNaN(date.getTime()) ? null : date
  }

  // 2. Format Français classique : DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const frMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
  if (frMatch) {
    const [, d, m, y] = frMatch
    const date = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0)
    return isNaN(date.getTime()) ? null : date
  }

  // 3. Format Français court : DD/MM/YY
  const frShortMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/)
  if (frShortMatch) {
    const [, d, m, yy] = frShortMatch
    const y = 2000 + Number(yy)
    const date = new Date(y, Number(m) - 1, Number(d), 12, 0, 0)
    return isNaN(date.getTime()) ? null : date
  }

  // 4. Fallback Date standard JavaScript
  const standard = new Date(s)
  if (!isNaN(standard.getTime())) return standard

  return null
}
