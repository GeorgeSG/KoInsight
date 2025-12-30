import { BookWithData } from '@koinsight/common/types';
import useSWR from 'swr';
import { fetchFromAPI } from './api';

export function useBookWithData(id: number) {
  // Always fetch deleted annotations so the frontend filter can control visibility
  return useSWR(`books/${id}?includeDeleted=true`, () => 
    fetchFromAPI<BookWithData>(`books/${id}?includeDeleted=true`)
  );
}
