import {
  Book,
  BookDevice,
  Device,
  KoReaderAnnotation,
  KoReaderBook,
  KoReaderPageStat,
  PageStat,
} from '@koinsight/common/types';
import Database, { Database as DatabaseType } from 'better-sqlite3';
import { AnnotationsRepository } from '../annotations/annotations-repository';
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

  static uploadStatisticData(
    booksToImport: KoReaderBook[],
    newPageStats: PageStat[],
    annotationsByBook?: Record<string, KoReaderAnnotation[]>
  ) {
    return db.transaction(async (trx) => {
      // Insert books
      const newBooks: Partial<Book>[] = booksToImport.map((book) => ({
        id: book.id,
        md5: book.md5,
        title: book.title,
        authors: book.authors,
        series: book.series,
        language: book.language,
      }));

      await Promise.all(
        newBooks.map(({ id, ...book }) => trx<Book>('book').insert(book).onConflict('md5').ignore())
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

      // Insert annotations if provided
      if (annotationsByBook) {
        const deviceId =
          newPageStats.length > 0 ? newPageStats[0].device_id : this.UNKNOWN_DEVICE_ID;

        await Promise.all(
          Object.entries(annotationsByBook).map(([bookMd5, annotations]) =>
            AnnotationsRepository.bulkInsert(bookMd5, deviceId, annotations, trx)
          )
        );

        // FIXME: with this, if there is only 1 annotation and it gets removed, it won't get marked as deleted, because `annotationsByBook` will be empty. It will only get marked as deleted if the user adds another annotation to trigger an update on the book.
        await Promise.all(
          Object.entries(annotationsByBook).map(([bookMd5, annotations]) =>
            this.detectAndMarkDeletedAnnotations(bookMd5, deviceId, annotations, trx)
          )
        );
      }

      await trx.commit();
    });
  }

  /**
   * Detect annotations that exist in the database but not in the sync data
   * These annotations were deleted in KoReader and should be marked as deleted
   *
   * @param bookMd5 - The book's MD5 hash
   * @param deviceId - The device ID
   * @param syncedAnnotations - Annotations received from KoReader
   * @param trx - Transaction to use
   */
  private static async detectAndMarkDeletedAnnotations(
    bookMd5: string,
    deviceId: string,
    syncedAnnotations: KoReaderAnnotation[],
    trx: any
  ): Promise<void> {
    // Get all existing non-deleted annotations for this book and device
    const existingAnnotations = await trx('annotation')
      .where({ book_md5: bookMd5, device_id: deviceId })
      .whereNull('deleted_at')
      .select('page_ref', 'datetime');

    // Create a Set of identifiers from synced annotations for fast lookup
    const syncedIdentifiers = new Set(syncedAnnotations.map((a) => `${a.page}|${a.datetime}`));

    // Find annotations that exist in DB but not in synced data
    const deletedAnnotations = existingAnnotations.filter(
      (a: { page_ref: string; datetime: string }) =>
        !syncedIdentifiers.has(`${a.page_ref}|${a.datetime}`)
    );

    if (deletedAnnotations.length > 0) {
      await AnnotationsRepository.markManyAsDeleted(bookMd5, deviceId, deletedAnnotations, trx);

      console.log(`Marked ${deletedAnnotations.length} annotations as deleted for book ${bookMd5}`);
    }
  }
}
