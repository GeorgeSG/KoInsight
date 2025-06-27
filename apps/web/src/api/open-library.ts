import { Book } from '@koinsight/common/types/book';
import { fetchFromAPI } from './api';

export function saveCover(bookId: Book['id'], coverId: string) {
  const params = new URLSearchParams({
    bookId: bookId.toString(),
    coverId,
  });

  return fetchFromAPI(`open-library/cover?${params}`);
}

export function listCovers(searchTerm: string, limit: number = 3) {
  const params = new URLSearchParams({
    searchTerm,
    limit: String(limit),
  });

  return fetchFromAPI<string[]>(`open-library/list-covers?${params.toString()}`);
}
