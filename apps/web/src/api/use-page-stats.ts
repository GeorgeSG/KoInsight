import { PageStat } from '@koinsight/common/types/page-stat';
import useSWR from 'swr';
import { fetchFromAPI } from './api';
import { GetAllStatsResponse } from '@koinsight/common/types';

export function usePageStats() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return useSWR(['stats', timeZone], () => fetchFromAPI<GetAllStatsResponse>('stats', 'GET', { time_zone: timeZone }), {
    fallbackData: {
      stats: [],
      perMonth: [],
      perDayOfTheWeek: [],
      mostPagesInADay: { pages: 0 },
      totalReadingTime: 0,
      longestDay: { duration: 0 },
      last7DaysReadTime: 0,
      currentDailyReadingStreak: 0,
      longestDailyReadingStreak: { days: 0 },
      totalPagesRead: 0,
    },
  });
}

export function useBookStats(bookMd5: string) {
  return useSWR(`stats/${bookMd5}`, () => fetchFromAPI<PageStat[]>(`stats/${bookMd5}`));
}