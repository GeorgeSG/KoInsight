import { PageStat } from '@koinsight/common/types/page-stat';
import useSWR from 'swr';
import { fetchFromAPI } from './api';
import { GetAllStatsResponse } from '@koinsight/common/types';

export function usePageStats() {
  return useSWR('stats', () => fetchFromAPI<GetAllStatsResponse>('stats'), {
    fallbackData: {
      stats: [],
      perMonth: [],
      perDayOfTheWeek: [],
      mostPagesInADay: 0,
      totalReadingTime: 0,
      longestDay: 0,
      last7DaysReadTime: 0,
      totalPagesRead: 0,
    },
  });
}

export function useBookStats(bookMd5: string) {
  return useSWR(`stats/${bookMd5}`, () => fetchFromAPI<PageStat[]>(`stats/${bookMd5}`));
}
