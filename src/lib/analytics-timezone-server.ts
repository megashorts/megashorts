import prisma from '@/lib/prisma';
import {
  DEFAULT_ANALYTICS_TIME_ZONE,
  normalizeAnalyticsTimeZone,
  type AnalyticsTimeZone,
} from '@/lib/analytics-timezone';

export async function getAnalyticsTimeZone(): Promise<AnalyticsTimeZone> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'analyticsTimeZone' },
    select: { value: true },
  });

  const stored = setting?.value as { enabled?: boolean; value?: unknown } | null | undefined;
  if (!stored || stored.enabled === false) {
    return DEFAULT_ANALYTICS_TIME_ZONE;
  }

  return normalizeAnalyticsTimeZone(stored.value);
}
