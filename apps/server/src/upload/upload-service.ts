import {
  Book,
  BookDevice,
  Device,
  KoReaderBook,
  KoReaderPageStat,
  PageStat,
} from '@koinsight/common/types';
import Database, { Database as DatabaseType } from 'better-sqlite3';
import { db } from '../knex';

export class UploadService {
  private static UNKNOWN_DEVICE_ID = 'manual-upload';

  static openStatisticsDbFile(uploadedFilePath: string) {
    const db = new Database(uploadedFilePath, { readonly: true });
    const bookIds = db.prepare('SELECT id FROM book').all();

    if (!bookIds.length) {
      throw new Error('No books found in the uploaded file');
    }

    return db;
  }

  static extractDataFromStatisticsDb(db: DatabaseType) {
    const newBooks = db.prepare('SELECT * FROM book').all() as KoReaderBook[];
    const dbPageStats = db.prepare('SELECT * FROM page_stat_data').all() as KoReaderPageStat[];

    const newPageStats: PageStat[] = dbPageStats.map(({ id_book, ...stat }) => ({
      book_md5: newBooks.find((book) => book.id === id_book)!.md5,
      device_id: this.UNKNOWN_DEVICE_ID,
      ...stat,
    }));

    return { newBooks, newPageStats };
  }

  static uploadStatisticData(booksToImport: KoReaderBook[], newPageStats: PageStat[]) {
    return db.transaction(async (trx) => {
      // Insert books
      const newBooks: Partial<Book>[] = booksToImport.map((book) => ({
        id: book.id,
        md5: book.md5,
        title: book.title,
        authors: book.authors,
        series: book.series,
        language: book.language,
        status: book.status ?? null,
      }));

      await Promise.all(
        newBooks.map(({ id, ...book }) => {
          const query = trx<Book>('book').insert(book).onConflict('md5');
          return book.status ? query.merge(['status']) : query.ignore();
        })
      );

      const hasUnknownDevices =
        newPageStats.length > 0 && newPageStats[0].device_id === this.UNKNOWN_DEVICE_ID;

      if (hasUnknownDevices) {
        let unknownDevice = await trx<Device>('device')
          .where({ id: this.UNKNOWN_DEVICE_ID })
          .first();

        if (!unknownDevice) {
          console.log('Creating unknown device');
          await trx<Device>('device').insert({
            id: this.UNKNOWN_DEVICE_ID,
            model: 'Manual Upload',
          });
        }
      }

      const newBookDevices: Omit<BookDevice, 'id'>[] = booksToImport.map((book) => ({
        device_id: newPageStats[0].device_id,
        book_md5: book.md5,
        last_open: book.last_open,
        pages: book.pages,
        notes: book.notes,
        highlights: book.highlights,
        total_read_pages: book.total_read_pages,
        total_read_time: book.total_read_time,
      }));

      await Promise.all(
        newBookDevices.map((bookDevice) =>
          trx<BookDevice>('book_device')
            .insert(bookDevice)
            .onConflict(['book_md5', 'device_id'])
            .merge([
              'last_open',
              'pages',
              'notes',
              'highlights',
              'total_read_time',
              'total_read_pages',
            ])
        )
      );

      // Insert page stats
      await Promise.all(
        newPageStats.map((pageStat) =>
          trx<PageStat>('page_stat')
            .insert(pageStat)
            .onConflict(['device_id', 'book_md5', 'page', 'start_time'])
            .merge(['duration', 'total_pages'])
        )
      );

      await trx.commit();
    });
  }
}
