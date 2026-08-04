import { PageStat } from '@koinsight/common/types/page-stat';
import { setHours, setMinutes, setSeconds, startOfDay, subDays } from 'date-fns';
import { Knex } from 'knex';
import { db } from '../../knex';
import { createPageStat } from '../factories/page-stat-factory';
import { SEEDED_DEVICES } from './01_devices';
import { SEEDED_BOOKS } from './02_books';
import { SEEDED_BOOK_DEVICES } from './03_book_devices';

// Simulates "accidental opens" in KOReader: a book is opened briefly and
// shows up on the calendar with a 00:00 total. Lets us exercise the
// "Hide entries under a minute" toggle on the calendar views.
export async function seed(_knex: Knex): Promise<void> {
  const today = new Date();
  const promises: Promise<PageStat>[] = [];

  const targetBooks = SEEDED_BOOKS.slice(0, 6);

  targetBooks.forEach((book, bookIndex) => {
    const bookDevice = SEEDED_BOOK_DEVICES.find((bd) => bd.book_md5 === book.md5);
    const device = SEEDED_DEVICES.find((d) => d.id === bookDevice?.device_id);
    if (!bookDevice || !device) return;

    // Spread short sessions across the last 14 days, one per book per day,
    // so multiple short entries appear on the same days too.
    for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
      if ((dayOffset + bookIndex) % 3 !== 0) continue;

      const day = subDays(startOfDay(today), dayOffset);
      const startTime = setSeconds(setMinutes(setHours(day, 9 + bookIndex), 15), 0);

      promises.push(
        createPageStat(db, book, bookDevice, device, {
          page: 1,
          start_time: startTime.valueOf() / 1000,
          duration: 5 + ((dayOffset + bookIndex) % 20), // 5-24 seconds
          total_pages: bookDevice.pages,
        })
      );
    }
  });

  const stats = await Promise.all(promises);
  console.log(`✓ Seeded ${stats.length} short (under a minute) reading sessions`);
}
