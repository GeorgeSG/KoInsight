import { Book, BookDevice, Device } from '@koinsight/common/types';
import { range } from 'ramda';
import { createBookDevice } from '../db/factories/book-device-factory';
import { createBook } from '../db/factories/book-factory';
import { createDevice } from '../db/factories/device-factory';
import { createPageStat } from '../db/factories/page-stat-factory';
import { db } from '../knex';
import { StatsService } from './stats-service';
import { subDays } from 'date-fns';

describe(StatsService, () => {
  let device: Device;
  let book: Book;
  let bookDevice: BookDevice;

  beforeEach(async () => {
    device = await createDevice(db);
    book = await createBook(db, { title: 'Test Book 1' });
    bookDevice = await createBookDevice(db, book, device, { pages: 100 });
  });

  describe(StatsService.getPerMonthReadingTime, () => {
    it('returns the correct reading time per month', async () => {
      const month1 = new Date('2025-02-03').getTime();
      const month2 = new Date('2025-04-03').getTime();

      const month1Stats = await Promise.all(
        range(0, 6).map(
          async (i) =>
            await createPageStat(db, book, bookDevice, device, {
              start_time: month1,
              duration: 10,
              page: i,
            })
        )
      );

      const month2Stats = await Promise.all(
        range(0, 2).map(
          async (i) =>
            await createPageStat(db, book, bookDevice, device, {
              start_time: month2,
              duration: 10,
              page: i,
            })
        )
      );

      const result = await StatsService.getPerMonthReadingTime([...month1Stats, ...month2Stats]);

      expect(result[0]).toEqual(
        expect.objectContaining({
          duration: 60,
          month: 'February 2025',
        })
      );

      expect(result[1]).toEqual(
        expect.objectContaining({
          duration: 20,
          month: 'April 2025',
        })
      );
    });

    it('returns an empty array with no stats', async () => {
      const result = await StatsService.getPerMonthReadingTime([]);
      expect(result).toEqual([]);
    });
  });

  describe(StatsService.totalReadingTime, () => {
    it('returns the correct total reading time', async () => {
      const stats = await Promise.all(
        range(0, 3).map(
          async (i) => await createPageStat(db, book, bookDevice, device, { duration: i * 10 })
        )
      );

      const result = await StatsService.totalReadingTime(stats);
      expect(result).toEqual(30);
    });

    it('returns 0 with no stats', async () => {
      const result = await StatsService.totalReadingTime([]);
      expect(result).toEqual(0);
    });
  });

  describe(StatsService.mostPagesInADay, () => {
    it('returns the correct most pages in a day', async () => {
      book = await createBook(db, { title: 'Test Book 1', reference_pages: undefined });

      const stats = await Promise.all(
        range(0, 3).map(
          async (i) =>
            await createPageStat(db, book, bookDevice, device, {
              start_time: new Date(2025, 1, 1 + i).getTime(),
            })
        )
      );

      stats.push(
        await createPageStat(db, book, bookDevice, device, {
          start_time: new Date(2025, 1, 1).getTime(),
        })
      );

      stats.push(
        await createPageStat(db, book, bookDevice, device, {
          start_time: new Date(2025, 1, 1).getTime(),
        })
      );

      const result = await StatsService.mostPagesInADay([book], stats);
      expect(result).toEqual(3);
    });

    it('works with reference pages', async () => {
      book = await createBook(db, { title: 'Test Book 1', reference_pages: 200 });
      bookDevice = await createBookDevice(db, book, device, { pages: 400 });

      const stats = await Promise.all(
        range(0, 3).map(
          async (i) =>
            await createPageStat(db, book, bookDevice, device, {
              start_time: new Date(2025, 1, 1 + i).getTime(),
            })
        )
      );

      stats.push(
        await createPageStat(db, book, bookDevice, device, {
          start_time: new Date(2025, 1, 1).getTime(),
        })
      );

      stats.push(
        await createPageStat(db, book, bookDevice, device, {
          start_time: new Date(2025, 1, 1).getTime(),
        })
      );

      const result = await StatsService.mostPagesInADay([book], stats);
      expect(result).toEqual(2); // result is rounded
    });

    it('returns 0 with no stats', async () => {
      const result = await StatsService.mostPagesInADay([book], []);
      expect(result).toEqual(0);
    });
  });

  describe(StatsService.longestDay, () => {
    it('returns the correct longest day', async () => {
      const stats = await Promise.all(
        range(0, 5).map(
          async (i) =>
            await createPageStat(db, book, bookDevice, device, {
              start_time: new Date(2025, 1, 1 + i).getTime(),
              duration: i * 10,
            })
        )
      );

      const result = await StatsService.longestDay(stats);
      expect(result).toEqual(40);
    });

    it('returns 0 with no stats', async () => {
      const result = await StatsService.longestDay([]);
      expect(result).toEqual(0);
    });
  });

  describe(StatsService.last7DaysReadTime, () => {
    it('returns the correct last 7 days read time', async () => {
      const stats = await Promise.all(
        range(0, 10).map(
          async (i) =>
            await createPageStat(db, book, bookDevice, device, {
              start_time: subDays(new Date(), i).getTime(),
              duration: i * 10,
            })
        )
      );

      const result = await StatsService.last7DaysReadTime(stats);
      expect(result).toEqual(210);
    });

    it('returns 0 with no stats', async () => {
      const result = await StatsService.last7DaysReadTime([]);
      expect(result).toEqual(0);
    });
  });

  describe(StatsService.perDayOfTheWeek, () => {
    // FIXME: Flaky - Depends on locale
    it.skip('returns the correct per day of the week', async () => {
      const stats = await Promise.all(
        range(0, 10).map(
          async (i) =>
            await createPageStat(db, book, bookDevice, device, {
              start_time: new Date(2025, 1, 1 + i).getTime(),
              duration: i * 10,
            })
        )
      );

      const result = await StatsService.perDayOfTheWeek(stats);
      expect(result).toEqual([
        { day: 0, name: 'Monday', value: 110 },
        { day: 1, name: 'Tuesday', value: 30 },
        { day: 2, name: 'Wednesday', value: 40 },
        { day: 3, name: 'Thursday', value: 50 },
        { day: 4, name: 'Friday', value: 60 },
        { day: 5, name: 'Saturday', value: 70 },
        { day: 6, name: 'Sunday', value: 90 },
      ]);
    });

    it('returns an empty array with no stats', async () => {
      const result = await StatsService.perDayOfTheWeek([]);
      expect(result).toEqual([]);
    });
  });
});
