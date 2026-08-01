import { Book, BookStatus, BookWithData } from '@koinsight/common/types';
import useSWR from 'swr';
import { API_URL, fetchFromAPI } from './api';

export function useBooks({ showHidden } = { showHidden: false }) {
  return useSWR(
    ['books', showHidden],
    () => fetchFromAPI<BookWithData[]>('books', 'GET', { showHidden }),
    {
      fallbackData: [],
    }
  );
}

export async function deleteBook(id: Book['id']) {
  return fetchFromAPI<{ message: string }>(`books/${id}`, 'DELETE');
}

export async function hideBook(id: Book['id']) {
  return fetchFromAPI<{ message: string }>(`books/${id}/hide`, 'PUT', { hidden: true });
}

export async function showBook(id: Book['id']) {
  return fetchFromAPI<{ message: string }>(`books/${id}/hide`, 'PUT', { hidden: false });
}

export async function updateBookReferencePages(id: Book['id'], referencePages: number | null) {
  return fetchFromAPI<Book>(`books/${id}/reference_pages`, 'PUT', {
    reference_pages: referencePages,
  });
}

export function uploadBookCover(bookId: Book['id'], formData: FormData) {
  return fetch(`${API_URL}/books/${bookId}/cover`, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'multipart/form-data' },
  });
}

export async function updateBookStatus(id: Book['id'], status: BookStatus) {
  return fetchFromAPI<{ message: string }>(`books/${id}/status`, 'PUT', { status });
}
