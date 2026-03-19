const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatTimestamp(timestamp: string | number): string {
  return DATE_TIME_FORMATTER.format(new Date(timestamp))
}
