export type BookStatus = 'complete' | 'reading' | 'abandoned' | 'on_hold' | null;

export type KoReaderBook = {
  id: number;
  md5: string;
  title: string;
  authors: string;
  notes: number;
  last_open: number;
  highlights: number;
  pages: number;
  series: string;
  language: string;
  // These fields only come from statistics.db sync, not annotation sync
  total_read_time?: number;
  total_read_pages?: number;
  status?: BookStatus;
};

export type DbBook = {
  id: number;
  md5: string;
  title: string;
  authors: string;
  series: string;
  language: string;
};

export type Book = DbBook & {
  soft_deleted: boolean;
  reference_pages: number | null;
  status: BookStatus;
};
