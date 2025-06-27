import { Book } from '@koinsight/common/types/book';
import { PageStat } from '@koinsight/common/types/page-stat';
import { subDays, subMinutes } from 'date-fns';
import { Knex } from 'knex';
import { SEEDED_DEVICES } from './01_devices';
import { SEEDED_BOOKS } from './02_books';
import { createPageStat, fakePageStat } from '../factories/page-stat-factory';
import { SEEDED_BOOK_DEVICES } from './03_book_devices';
import { db } from '../../knex';

function generateBookStats(book: Book): PageStat[] {
  const pageStats: PageStat[] = [];
  const today = new Date();

  const startDate = subDays(today, Math.floor(Math.random() * 100));

  const maxPages = Math.max(book.reference_pages ?? 0, 300);
  for (let i = 0; i < maxPages; i++) {
    pageStats.push({
      page: i,
      start_time: subMinutes(startDate, (maxPages - i) * 30).valueOf() / 1000,
      duration: Math.floor(Math.random() * 100),
      total_pages: Math.floor(Math.random() * maxPages),
      device_id: SEEDED_DEVICES[Math.floor(Math.random() * SEEDED_DEVICES.length)].id,
      book_md5: book.md5,
    });
  }

  return pageStats;
}

export async function seed(knex: Knex): Promise<void> {
  await knex('page_stat').del();

  let promises: Promise<PageStat>[] = [];

  SEEDED_BOOKS.forEach((book) => {
    const bookDevice = SEEDED_BOOK_DEVICES.find((bd) => bd.book_md5 === book.md5);
    const device = SEEDED_DEVICES.find((d) => d.id === bookDevice?.device_id);

    if (!bookDevice || !device) {
      return;
    }

    const today = new Date();
    const startDate = subDays(today, Math.floor(Math.random() * 100));
    const readPages = Math.floor(Math.random() * bookDevice.pages);

    for (let i = 0; i < readPages; i++) {
      promises.push(
        createPageStat(db, book, bookDevice, device, {
          page: i,
          start_time: subMinutes(startDate, (readPages - i) * 30).valueOf() / 1000,
          duration: Math.floor(Math.random() * 100),
          total_pages: bookDevice.pages,
        })
      );
    }
  });

  await Promise.all(promises);
}
