export function dateKey(value: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function formatDay(value: string, timeZone: string): { weekday: string; date: string } {
  const date = new Date(value);
  return {
    weekday: new Intl.DateTimeFormat('ru-RU', { timeZone, weekday: 'short' })
      .format(date)
      .replace('.', ''),
    date: new Intl.DateTimeFormat('ru-RU', { timeZone, day: 'numeric', month: 'short' })
      .format(date)
      .replace('.', ''),
  };
}

export function formatTime(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDateTime(value: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    ...(timeZone ? { timeZone } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}
