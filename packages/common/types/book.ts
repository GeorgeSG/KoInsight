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
  total_read_time: number;
  total_read_pages: number;
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
};
