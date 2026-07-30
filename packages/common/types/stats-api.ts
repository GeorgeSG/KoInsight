import { PageStat } from './page-stat';

export type PerMonthReadingTime = {
  month: string;
  duration: number;
  // FIXME: Date is used for sorting. Can just pass startOfMonth timestamp and format date in UI.
  date: number;
};

export type PerDayOfTheWeek = {
  name: string;
  value: number;
  day: number;
};

export type ReadingPageStat = {
  pages: number;
  timestamp?: number;
};

export type ReadingDayStat = {
  duration: number;
  timestamp?: number;
};

export type DailyReadingStreak = {
  days: number;
  start?: number;
  end?: number;
};

export type GetAllStatsResponse = {
  stats: PageStat[];
  perMonth: PerMonthReadingTime[];
  perDayOfTheWeek: PerDayOfTheWeek[];
  mostPagesInADay: ReadingPageStat;
  totalReadingTime: number;
  longestDay: ReadingDayStat;
  last7DaysReadTime: number;
  currentDailyReadingStreak: number;
  longestDailyReadingStreak: DailyReadingStreak;
  totalPagesRead: number;
};
