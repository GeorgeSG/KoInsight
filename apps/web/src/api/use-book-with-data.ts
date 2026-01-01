import { BookWithData } from '@koinsight/common/types';
import useSWR from 'swr';
import { fetchFromAPI } from './api';

export function useBookWithData(id: number) {
  // Always fetch deleted annotations so the frontend filter can control visibility
  return useSWR(
    `books/${id}?includeDeleted=true`,
    () => fetchFromAPI<BookWithData>(`books/${id}?includeDeleted=true`),
    {
      // Revalidate when window regains focus (user comes back from KoReader)
      revalidateOnFocus: true,
      // Revalidate when network reconnects
      revalidateOnReconnect: true,
      // Reduce deduping interval to 5 seconds (fresher data)
      dedupingInterval: 5000,
      // Keep cached data for 30 seconds before considering it stale
      revalidateIfStale: true,
    }
  );
}
