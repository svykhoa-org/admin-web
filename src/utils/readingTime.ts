// Cheap reading-time estimate: strip HTML → whitespace word count ÷ words-per-minute.
// Matches the server's wordCount approach; ~200 wpm is the common reading pace.
export const readingMinutes = (html: string | null | undefined, wpm = 200): number => {
  const text = (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = text ? text.split(' ').length : 0
  return Math.max(1, Math.round(words / wpm))
}
