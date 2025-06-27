import { Book, BookDevice, Device } from '@koinsight/common/types';
import { addDays, startOfDay } from 'date-fns';
import { createBookDevice } from '../db/factories/book-device-factory';
import { createBook } from '../db/factories/book-factory';
import { createDevice } from '../db/factories/device-factory';
import { createPageStat } from '../db/factories/page-stat-factory';
import { db } from '../knex';
import { BooksService } from './books-service';

describe(BooksService.withData, () => {
  let device: Device;

  beforeEach(async () => {
    device = await createDevice(db);
  });
  describe('total_pages', () => {
    it('returns reference pages if available', async () => {
      const book = await createBook(db, { title: 'Test Book 1', reference_pages: 121 });

      const result = await BooksService.withData(book);

      expect(result.total_pages).toEqual(121);
    });

    it('returns the max pages from device data if reference pages are not available', async () => {
      const book = await createBook(db, { title: 'Test Book 1', reference_pages: undefined });

      await createBookDevice(db, book, device, { pages: 100 });

      const device2 = await createDevice(db);
      await createBookDevice(db, book, device2, { pages: 200 });

      const result = await BooksService.withData(book);

      expect(result.total_pages).toEqual(200);
    });
  });

  describe('total_read_time', () => {
    it('returns the sum of total read time from device data', async () => {
      const book1 = await createBook(db, { title: 'Test Book 1' });

      await db<BookDevice>('book_device').insert([
        { book_md5: book1.md5, total_read_time: 100 },
        { book_md5: book1.md5, total_read_time: 200 },
      ]);

      const result = await BooksService.withData(book1);

      expect(result.total_read_time).toEqual(300);
    });

    it('returns 0 if no device data is available', async () => {
      const book1 = await createBook(db, { title: 'Test Book 1' });
      const result = await BooksService.withData(book1);

      expect(result.total_read_time).toEqual(0);
    });
  });

  describe('started_reading', () => {
    it('returns the earliest start time from stats', async () => {
      const book1 = await createBook(db, { title: 'Test Book 1' });
      const bookDevice = await createBookDevice(db, book1, device, { book_md5: book1.md5 });

      await createPageStat(db, book1, bookDevice, device, { start_time: 1720898518 });
      await createPageStat(db, book1, bookDevice, device, { start_time: 1720898618 });
      await createPageStat(db, book1, bookDevice, device, { start_time: 1720898718 });
      await createPageStat(db, book1, bookDevice, device, { start_time: 1720898818 });

      const result = await BooksService.withData(book1);

      expect(result.started_reading).toEqual(1720898518000);
    });
  });

  describe('read_per_day', () => {
    it('returns the read time per day', async () => {
      const book1 = await createBook(db, { title: 'Test Book 1', reference_pages: 100 });
      const bookDevice = await createBookDevice(db, book1, device, {
        book_md5: book1.md5,
        pages: 100,
      });

      const day1 = 1720898518; // database dates are stored in seconds :/
      const day2 = addDays(day1, 1).getTime();
      const day3 = addDays(day1, 2).getTime();

      await createPageStat(db, book1, bookDevice, device, {
        start_time: day1,
        duration: 1,
        page: 1,
      });
      await createPageStat(db, book1, bookDevice, device, {
        start_time: day1,
        duration: 10,
        page: 2,
      });
      await createPageStat(db, book1, bookDevice, device, {
        start_time: day1,
        duration: 100,
        page: 3,
      });
      await createPageStat(db, book1, bookDevice, device, {
        start_time: day2,
        duration: 2,
        page: 4,
      });
      await createPageStat(db, book1, bookDevice, device, {
        start_time: day2,
        duration: 20,
        page: 5,
      });
      await createPageStat(db, book1, bookDevice, device, {
        start_time: day2,
        duration: 200,
        page: 6,
      });
      await createPageStat(db, book1, bookDevice, device, {
        start_time: day3,
        duration: 3,
        page: 7,
      });
      await createPageStat(db, book1, bookDevice, device, {
        start_time: day3,
        duration: 30,
        page: 8,
      });
      await createPageStat(db, book1, bookDevice, device, {
        start_time: day3,
        duration: 300,
        page: 9,
      });

      const result = await BooksService.withData(book1);

      expect(result.read_per_day).toEqual({
        [startOfDay(day1 * 1000).getTime()]: 111,
        [startOfDay(day2 * 1000).getTime()]: 222,
        [startOfDay(day3 * 1000).getTime()]: 333,
      });
    });

    it('returns an empty object if no stats are available', async () => {
      const book1 = await createBook(db, { title: 'Test Book 1' });
      const result = await BooksService.withData(book1);

      expect(result.read_per_day).toEqual({});
    });
  });

  describe('total_read_pages', () => {
    describe('with reference pages', () => {
      it('returns the total read pages', async () => {
        const book1 = await createBook(db, { title: 'Test Book 1', reference_pages: 100 });
        const bookDevice1 = await createBookDevice(db, book1, device, {
          book_md5: book1.md5,
          pages: 200, // each page counts as half
        });
        const device2 = await createDevice(db);
        const bookDevice2 = await createBookDevice(db, book1, device2, {
          book_md5: book1.md5,
          pages: 50, // each page counts as 2
        });

        // 2 pages on device 1
        await createPageStat(db, book1, bookDevice1, device, { page: 1 });
        await createPageStat(db, book1, bookDevice1, device, { page: 2 });
        await createPageStat(db, book1, bookDevice1, device, { page: 3 });
        await createPageStat(db, book1, bookDevice1, device, { page: 4 });

        // 8 pages on device 2
        await createPageStat(db, book1, bookDevice2, device, { page: 8 });
        await createPageStat(db, book1, bookDevice2, device, { page: 9 });
        await createPageStat(db, book1, bookDevice2, device, { page: 10 });
        await createPageStat(db, book1, bookDevice2, device, { page: 11 });

        const result = await BooksService.withData(book1);

        expect(result.total_read_pages).toEqual(10);
      });

      it('returns 0 if no pages are read', async () => {
        const book1 = await createBook(db, { title: 'Test Book 1', reference_pages: 100 });
        const result = await BooksService.withData(book1);

        expect(result.total_read_pages).toEqual(0);
      });
    });

    describe('without reference pages', () => {
      it('returns the total read pages', async () => {
        const book1 = await createBook(db, { title: 'Test Book 1', reference_pages: undefined });
        const bookDevice1 = await createBookDevice(db, book1, device, {
          book_md5: book1.md5,
          pages: 200,
        });
        const device2 = await createDevice(db);
        const bookDevice2 = await createBookDevice(db, book1, device2, {
          book_md5: book1.md5,
          pages: 50,
        });

        await createPageStat(db, book1, bookDevice1, device, { page: 1 });
        await createPageStat(db, book1, bookDevice1, device, { page: 2 });
        await createPageStat(db, book1, bookDevice1, device, { page: 3 });
        await createPageStat(db, book1, bookDevice1, device, { page: 4 });

        await createPageStat(db, book1, bookDevice2, device, { page: 8 });
        await createPageStat(db, book1, bookDevice2, device, { page: 9 });
        await createPageStat(db, book1, bookDevice2, device, { page: 10 });
        await createPageStat(db, book1, bookDevice2, device, { page: 11 });

        const result = await BooksService.withData(book1);

        expect(result.total_read_pages).toEqual(8);
      });

      it('returns 0 if no pages are read', async () => {
        const book1 = await createBook(db, { title: 'Test Book 1', reference_pages: 100 });
        const result = await BooksService.withData(book1);

        expect(result.total_read_pages).toEqual(0);
      });
    });
  });
});

describe(BooksService.getUniqueReadPages, () => {
  let device1: Device;
  let device2: Device;
  let book1: Book;

  beforeEach(async () => {
    device1 = await createDevice(db);
    device2 = await createDevice(db);
    book1 = await createBook(db, { title: 'Test Book 1', reference_pages: 100 });
  });

  it('returns unique read pages for a book with reference pages', async () => {
    const bookDevice1 = await createBookDevice(db, book1, device1, {
      book_md5: book1.md5,
      pages: 50,
    });
    const bookDevice2 = await createBookDevice(db, book1, device2, {
      book_md5: book1.md5,
      pages: 200,
    });

    const statPromises = [
      createPageStat(db, book1, bookDevice1, device1, { page: 1, total_pages: 50 }),
      createPageStat(db, book1, bookDevice1, device1, { page: 2, total_pages: 50 }),

      createPageStat(db, book1, bookDevice2, device2, { page: 10, total_pages: 200 }),
      createPageStat(db, book1, bookDevice2, device2, { page: 11, total_pages: 200 }),
      createPageStat(db, book1, bookDevice2, device2, { page: 12, total_pages: 200 }),
      createPageStat(db, book1, bookDevice2, device2, { page: 13, total_pages: 200 }),
    ];

    const stats = await Promise.all(statPromises);

    const result = await BooksService.getUniqueReadPages(book1, stats);

    expect(result).toEqual(6);
  });

  it('returns unique read pages with overlapping page stats', async () => {
    const bookDevice1 = await createBookDevice(db, book1, device1, {
      book_md5: book1.md5,
      pages: 100,
    });
    const bookDevice2 = await createBookDevice(db, book1, device2, {
      book_md5: book1.md5,
      pages: 100,
    });

    const statPromises = [
      createPageStat(db, book1, bookDevice1, device1, { page: 2, total_pages: 100 }),
      createPageStat(db, book1, bookDevice1, device1, { page: 3, total_pages: 100 }),
      createPageStat(db, book1, bookDevice1, device1, { page: 4, total_pages: 100 }),

      createPageStat(db, book1, bookDevice2, device2, { page: 3, total_pages: 100 }),
      createPageStat(db, book1, bookDevice2, device2, { page: 4, total_pages: 100 }),
      createPageStat(db, book1, bookDevice2, device2, { page: 5, total_pages: 100 }),
    ];

    const stats = await Promise.all(statPromises);

    const result = await BooksService.getUniqueReadPages(book1, stats);

    expect(result).toEqual(4);
  });

  it('returns unique read pages with partially read pages', async () => {
    const bookDevice1 = await createBookDevice(db, book1, device1, {
      book_md5: book1.md5,
      pages: 50,
    });
    const bookDevice2 = await createBookDevice(db, book1, device2, {
      book_md5: book1.md5,
      pages: 200,
    });

    const statPromises = [
      // these count for 2
      createPageStat(db, book1, bookDevice1, device1, { page: 1, total_pages: 50 }),
      createPageStat(db, book1, bookDevice1, device1, { page: 2, total_pages: 50 }),

      // these count for .5
      createPageStat(db, book1, bookDevice2, device2, { page: 10, total_pages: 200 }),
      createPageStat(db, book1, bookDevice2, device2, { page: 11, total_pages: 200 }),
      createPageStat(db, book1, bookDevice2, device2, { page: 12, total_pages: 200 }),
    ];

    const stats = await Promise.all(statPromises);

    const result = await BooksService.getUniqueReadPages(book1, stats);

    expect(result).toEqual(6); // result is rounded
  });
});
