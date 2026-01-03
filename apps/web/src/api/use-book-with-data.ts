import { BookWithData } from '@koinsight/common/types';
import useSWR from 'swr';
import { fetchFromAPI } from './api';

export function useBookWithData(id: number) {
  return useSWR(`books/${id}`, () => fetchFromAPI<BookWithData>(`books/${id}`));
}
