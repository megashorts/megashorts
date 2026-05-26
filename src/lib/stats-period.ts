export interface PeriodRange {
  key: string;
  label: string;
  start?: Date;
  end?: Date;
}

export interface RecentIsoWeekOption {
  value: string;
  key: string;
  label: string;
  year: number;
  week: number;
  start: Date;
  end: Date;
  isCurrent: boolean;
}

export type StatsPeriodUnit = "daily" | "weekly" | "monthly";

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function endOfUtcDay(date: Date) {
  return new Date(startOfUtcDay(date).getTime() + DAY_MS - 1);
}

export function getIsoWeekStart(year: number, week: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4.getTime() - (jan4Day - 1) * DAY_MS);

  return new Date(week1Monday.getTime() + (week - 1) * 7 * DAY_MS);
}

export function getIsoWeekLabel(year: number, week: number, locale = "ko") {
  const start = getIsoWeekStart(year, week);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const format = (date: Date) => `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;

  if (locale === "zh") {
    return `${year}年 第${week}周 (${format(start)} ~ ${format(end)})`;
  }
  if (locale === "en") {
    return `Week ${week}, ${year} (${format(start)} ~ ${format(end)})`;
  }
  return `${year}년 ${week}주차 (${format(start)} ~ ${format(end)})`;
}

export function getCurrentIsoWeek(date = new Date()) {
  const target = startOfUtcDay(date);
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);

  return {
    year: target.getUTCFullYear(),
    week,
  };
}

export function parseStatsPeriod(period = "current", locale = "ko"): PeriodRange {
  const now = new Date();

  if (!period || period === "current") {
    const { year, week } = getCurrentIsoWeek(now);
    const start = getIsoWeekStart(year, week);

    return {
      key: `${year}-W${String(week).padStart(2, "0")}`,
      label: getIsoWeekLabel(year, week, locale),
      start,
      end: new Date(start.getTime() + 7 * DAY_MS - 1),
    };
  }

  if (period === "all") {
    return {
      key: "all",
      label: locale === "zh" ? "全部期间" : locale === "en" ? "All Periods" : "전체 기간"
    };
  }

  const rollingMatch = period.match(/^(\d+)days$/);
  if (rollingMatch) {
    const days = Number(rollingMatch[1]);
    const end = new Date();
    const start = new Date(end.getTime() - days * DAY_MS);

    return {
      key: period,
      label: locale === "zh" ? `最近 ${days}天` : locale === "en" ? `Last ${days} Days` : `최근 ${days}일`,
      start,
      end,
    };
  }

  const weekMatch = period.match(/^(\d{4})-W(\d{1,2})$/);
  if (weekMatch) {
    const year = Number(weekMatch[1]);
    const week = Number(weekMatch[2]);
    const start = getIsoWeekStart(year, week);

    return {
      key: `${year}-W${String(week).padStart(2, "0")}`,
      label: getIsoWeekLabel(year, week, locale),
      start,
      end: new Date(start.getTime() + 7 * DAY_MS - 1),
    };
  }

  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]) - 1;
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 1) - 1);

    return {
      key: period,
      label: locale === "zh" ? `${year}年 ${month + 1}月` : locale === "en" ? `${month + 1}/${year}` : `${year}년 ${month + 1}월`,
      start,
      end,
    };
  }

  const dayMatch = period.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayMatch) {
    const date = new Date(`${period}T00:00:00.000Z`);

    return {
      key: period,
      label: period,
      start: startOfUtcDay(date),
      end: endOfUtcDay(date),
    };
  }

  return parseStatsPeriod("current", locale);
}

export function inferStatsPeriodUnit(period = "current"): StatsPeriodUnit {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return "daily";
  if (/^\d{4}-\d{2}$/.test(period)) return "monthly";
  return "weekly";
}

export function getCurrentStatsPeriod(unit: StatsPeriodUnit = "weekly") {
  const now = new Date();

  if (unit === "daily") {
    return startOfUtcDay(now).toISOString().slice(0, 10);
  }

  if (unit === "monthly") {
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `${now.getUTCFullYear()}-${month}`;
  }

  const { year, week } = getCurrentIsoWeek(now);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function periodDateKey(period: string, unit: StatsPeriodUnit = inferStatsPeriodUnit(period)) {
  const explicitPeriod = period && period !== "current" ? period : getCurrentStatsPeriod(unit);
  const range = parseStatsPeriod(explicitPeriod);

  return range.end ? range.end.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export function getStatsPeriodLabel(period: string, locale = "ko") {
  return parseStatsPeriod(period, locale).label;
}

export function createdAtFilter(range: PeriodRange) {
  if (!range.start || !range.end) return {};

  return {
    createdAt: {
      gte: range.start,
      lte: range.end,
    },
  };
}

export function requestedAtFilter(range: PeriodRange) {
  if (!range.start || !range.end) return {};

  return {
    requestedAt: {
      gte: range.start,
      lte: range.end,
    },
  };
}

export function getRecentIsoWeeks(count = 8, locale = "ko"): RecentIsoWeekOption[] {
  const current = getCurrentIsoWeek();
  const weeks: RecentIsoWeekOption[] = [];

  for (let index = 0; index < count; index += 1) {
    const currentStart = getIsoWeekStart(current.year, current.week);
    const start = new Date(currentStart.getTime() - index * 7 * DAY_MS);
    const weekInfo = getCurrentIsoWeek(start);
    const key = `${weekInfo.year}-W${String(weekInfo.week).padStart(2, "0")}`;
    const end = new Date(start.getTime() + 7 * DAY_MS - 1);
    const isCurrent = index === 0;

    const currentLabel = locale === "zh"
      ? `当前周 (${getIsoWeekLabel(weekInfo.year, weekInfo.week, locale)})`
      : locale === "en"
      ? `Current Week (${getIsoWeekLabel(weekInfo.year, weekInfo.week, locale)})`
      : `현재 주차 (${getIsoWeekLabel(weekInfo.year, weekInfo.week, locale)})`;

    weeks.push({
      value: isCurrent ? "current" : key,
      key,
      label: isCurrent ? currentLabel : getIsoWeekLabel(weekInfo.year, weekInfo.week, locale),
      year: weekInfo.year,
      week: weekInfo.week,
      start,
      end,
      isCurrent,
    });
  }

  return weeks;
}

export function getRecentStatsPeriods(unit: StatsPeriodUnit = "weekly", count = 8, locale = "ko") {
  if (unit === "weekly") {
    return getRecentIsoWeeks(count, locale).map((option) => ({
      value: option.key,
      key: option.key,
      label: option.isCurrent
        ? locale === "zh"
          ? `当前周（${getIsoWeekLabel(option.year, option.week, locale)}）`
          : locale === "en"
            ? `Current Week (${getIsoWeekLabel(option.year, option.week, locale)})`
            : `현재 주차 (${getIsoWeekLabel(option.year, option.week, locale)})`
        : option.label,
      start: option.start,
      end: option.end,
      unit,
      isCurrent: option.isCurrent,
    }));
  }

  const now = startOfUtcDay(new Date());
  const options = [];

  for (let index = 0; index < count; index += 1) {
    if (unit === "daily") {
      const date = new Date(now.getTime() - index * DAY_MS);
      const value = date.toISOString().slice(0, 10);
      options.push({
        value,
        key: value,
        label: index === 0
          ? locale === "zh" ? `今天 (${value})` : locale === "en" ? `Today (${value})` : `오늘 (${value})`
          : value,
        start: startOfUtcDay(date),
        end: endOfUtcDay(date),
        unit,
        isCurrent: index === 0,
      });
    } else {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
      const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = getStatsPeriodLabel(value, locale);
      options.push({
        value,
        key: value,
        label: index === 0
          ? locale === "zh" ? `本月 (${label})` : locale === "en" ? `This Month (${label})` : `이번 달 (${label})`
          : label,
        start: parseStatsPeriod(value).start,
        end: parseStatsPeriod(value).end,
        unit,
        isCurrent: index === 0,
      });
    }
  }

  return options;
}
