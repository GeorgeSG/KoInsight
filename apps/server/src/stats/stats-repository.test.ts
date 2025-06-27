import { Book, Device } from '@koinsight/common/types';
import { createBookDevice } from '../db/factories/book-device-factory';
import { createBook } from '../db/factories/book-factory';
import { createDevice } from '../db/factories/device-factory';
import { createPageStat } from '../db/factories/page-stat-factory';
import { db } from '../knex';
import { StatsRepository } from './stats-repository';

describe(StatsRepository, () => {
  describe(StatsRepository.getAll, () => {
    let device1: Device;
    let book1: Book;

    beforeEach(async () => {
      device1 = await createDevice(db);
      book1 = await createBook(db, { title: 'Book 1', soft_deleted: false });
    });

    it('does not include soft deleted books', async () => {
      const bookDevice1 = await createBookDevice(db, book1, device1);

      await createPageStat(db, book1, bookDevice1, device1, { page: 1, duration: 20 });
      await createPageStat(db, book1, bookDevice1, device1, { page: 2, duration: 20 });
      await createPageStat(db, book1, bookDevice1, device1, { page: 3, duration: 20 });

      const book2 = await createBook(db, { title: 'Book 2', soft_deleted: true });
      const bookDevice2 = await createBookDevice(db, book2, device1);
      await createPageStat(db, book2, bookDevice2, device1, { page: 1, duration: 10 });
      await createPageStat(db, book2, bookDevice2, device1, { page: 2, duration: 10 });
      await createPageStat(db, book2, bookDevice2, device1, { page: 3, duration: 10 });

      const stats = await StatsRepository.getAll();
      expect(stats).toHaveLength(3);
      expect(stats.map((s) => s.book_md5)).not.includes(book2.md5);
    });
  });
});
