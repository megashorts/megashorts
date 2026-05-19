export interface PeriodRange {
  key: string;
  label: string;
  start?: Date;
  end?: Date;
}

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

export function getIsoWeekLabel(year: number, week: number) {
  const start = getIsoWeekStart(year, week);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const format = (date: Date) => `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;

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

export function parseStatsPeriod(period = "current"): PeriodRange {
  const now = new Date();

  if (!period || period === "current") {
    const { year, week } = getCurrentIsoWeek(now);
    const start = getIsoWeekStart(year, week);

    return {
      key: `${year}-W${String(week).padStart(2, "0")}`,
      label: getIsoWeekLabel(year, week),
      start,
      end: new Date(start.getTime() + 7 * DAY_MS - 1),
    };
  }

  if (period === "all") {
    return { key: "all", label: "전체 기간" };
  }

  const rollingMatch = period.match(/^(\d+)days$/);
  if (rollingMatch) {
    const days = Number(rollingMatch[1]);
    const end = new Date();
    const start = new Date(end.getTime() - days * DAY_MS);

    return {
      key: period,
      label: `최근 ${days}일`,
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
      label: getIsoWeekLabel(year, week),
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
      label: `${year}년 ${month + 1}월`,
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

  return parseStatsPeriod("current");
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

export function getRecentIsoWeeks(count = 8) {
  const current = getCurrentIsoWeek();
  const weeks = [];

  for (let index = 0; index < count; index += 1) {
    const currentStart = getIsoWeekStart(current.year, current.week);
    const start = new Date(currentStart.getTime() - index * 7 * DAY_MS);
    const weekInfo = getCurrentIsoWeek(start);
    const key = `${weekInfo.year}-W${String(weekInfo.week).padStart(2, "0")}`;

    weeks.push({
      value: index === 0 ? "current" : key,
      key,
      label: index === 0 ? `현재 주차 (${getIsoWeekLabel(weekInfo.year, weekInfo.week)})` : getIsoWeekLabel(weekInfo.year, weekInfo.week),
    });
  }

  return weeks;
}
