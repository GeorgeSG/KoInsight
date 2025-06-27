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

export type GetAllStatsResponse = {
  stats: PageStat[];
  perMonth: PerMonthReadingTime[];
  perDayOfTheWeek: PerDayOfTheWeek[];
  mostPagesInADay: number;
  totalReadingTime: number;
  longestDay: number;
  last7DaysReadTime: number;
  totalPagesRead: number;
};
