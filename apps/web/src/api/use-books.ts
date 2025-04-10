import { Book } from '@koinsight/common/types/book';
import useSWR from 'swr';
import { fetchFromAPI } from './api';

export function useBooks() {
  return useSWR('books', () => fetchFromAPI<Book[]>('books'), { fallbackData: [] });
}

export async function deleteBook(id: string | number) {
  return fetchFromAPI<{ message: string }>(`books/${id}`, 'DELETE');
}
