export const ANALYTICS_TIME_ZONE_OPTIONS = [
  'UTC',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
] as const;

export type AnalyticsTimeZone = (typeof ANALYTICS_TIME_ZONE_OPTIONS)[number];

export const DEFAULT_ANALYTICS_TIME_ZONE: AnalyticsTimeZone = 'Asia/Seoul';

const TIME_ZONE_SET = new Set<string>(ANALYTICS_TIME_ZONE_OPTIONS);

export function isAnalyticsTimeZone(value: unknown): value is AnalyticsTimeZone {
  return typeof value === 'string' && TIME_ZONE_SET.has(value);
}

export function normalizeAnalyticsTimeZone(value: unknown): AnalyticsTimeZone {
  return isAnalyticsTimeZone(value) ? value : DEFAULT_ANALYTICS_TIME_ZONE;
}

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
}
