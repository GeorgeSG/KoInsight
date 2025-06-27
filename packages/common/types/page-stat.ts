export type KoReaderPageStat = {
  page: number;
  start_time: number;
  duration: number;
  total_pages: number;
  id_book: number;
};

export type PageStat = Omit<KoReaderPageStat, 'id_book'> & {
  device_id: string;
  book_md5: string;
};
