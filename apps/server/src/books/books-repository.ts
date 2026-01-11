import { BookGenre, BookWithData } from '@koinsight/common/types';
import { Book } from '@koinsight/common/types/book';
import { BookDevice } from '@koinsight/common/types/book-device';
import { Genre } from '@koinsight/common/types/genre';
import { sum } from 'ramda';
import { AnnotationsRepository } from '../annotations/annotations-repository';
import { GenreRepository } from '../genres/genre-repository';
import { db } from '../knex';
import { StatsRepository } from '../stats/stats-repository';
import { BooksService } from './books-service';

export class BooksRepository {
  static async getAll(): Promise<Book[]> {
    return db<Book>('book').select('*').where({ soft_deleted: false });
  }

  static async getById(id: number): Promise<Book | undefined> {
    return db<Book>('book').where({ id }).first();
  }

  static async insert(book: Partial<Book>): Promise<number[]> {
    return db<Book>('book').insert(book);
  }

  static async update(id: number, book: Partial<Book>): Promise<number> {
    return db<Book>('book').where({ id }).update(book);
  }

  static async softDelete(id: number, soft_deleted = true): Promise<number> {
    return db<Book>('book').where({ id }).update({ soft_deleted });
  }

  static async delete(book: Book) {
    await db.transaction(async (trx) => {
      await trx<BookDevice>('book_device').where({ book_md5: book.md5 }).delete();

      await trx<BookGenre>('book_genre').where({ book_md5: book.md5 }).delete();

      await trx<Book>('book').where({ id: book.id }).delete();
    });
  }

  static async searchByTitle(title: string): Promise<Book[]> {
    return db<Book>('book').where('title', 'like', `%${title}%`);
  }

  static async getBookDevices(md5: Book['md5']): Promise<BookDevice[]> {
    return db<BookDevice>('book_device').where({ book_md5: md5 });
  }

  static async getAllWithData(returnDeleted: boolean = false): Promise<BookWithData[]> {
    const books = await db('book')
      .select(
        'book.*',
        db.raw(`(
          SELECT json_group_array(
            json_object('id', genre.id, 'name', genre.name)
          )
          FROM book_genre
          JOIN genre ON genre.id = book_genre.genre_id
          WHERE book_genre.book_md5 = book.md5
        ) as genres`),
        db.raw(`(
          SELECT json_group_array(
            json_object(
              'id', bd.id,
              'device_id', bd.device_id,
              'last_open', bd.last_open,
              'notes', bd.notes,
              'highlights', bd.highlights,
              'pages', bd.pages,
              'total_read_time', bd.total_read_time,
              'total_read_pages', bd.total_read_pages
            )
          )
          FROM book_device bd
          WHERE bd.book_md5 = book.md5
        ) as book_devices`)
      )
      .where(returnDeleted ? {} : { 'book.soft_deleted': false });

    return Promise.all(
      // FIXME: book is any, this looses typesafety
      books.map(async (book): Promise<BookWithData> => {
        const stats = await StatsRepository.getByBookMD5(book.md5);

        // Get annotations data
        const annotations = await AnnotationsRepository.getByBookMd5(book.md5);
        const annotationCounts = await AnnotationsRepository.getCountsByType(book.md5);

        const genres = JSON.parse(book.genres) as Genre[];
        const bookDevices = JSON.parse(book.book_devices) as BookDevice[];

        const totalPages = BooksService.getTotalPages(book, bookDevices);
        const lastOpen = BooksService.getLastOpen(bookDevices);
        const totalReadTime = BooksService.getTotalReadTime(bookDevices);
        const totalReadPages = BooksService.getTotalReadPages(book, stats);
        const uniqueReadPages = BooksService.getUniqueReadPages(book, stats);
        const started_reading = BooksService.getStartedReading(stats);
        const read_per_day = BooksService.getReadPerDay(stats);

        const { genres: raw_genres, book_devices, ...book_props } = book;

        return {
          ...book_props,
          genres: genres,
          device_data: bookDevices,
          total_pages: totalPages,
          total_read_pages: totalReadPages,
          unique_read_pages: uniqueReadPages,
          total_read_time: totalReadTime,
          last_open: lastOpen,
          highlights: sum(bookDevices.map((device) => device.highlights)),
          notes: sum(bookDevices.map((device) => device.notes)),
          read_per_day,
          started_reading,
          // Annotation data
          annotations,
          highlights_count: annotationCounts.highlight,
          notes_count: annotationCounts.note,
          bookmarks_count: annotationCounts.bookmark,
          deleted_count: await AnnotationsRepository.getDeletedCount(book.md5),
          stats,
        };
      })
    );
  }

  static async addGenre(md5: Book['md5'], genreName: string) {
    const genre = await GenreRepository.findOrCreate({ name: genreName });
    return db<BookGenre>('book_genre').insert({ book_md5: md5, genre_id: genre.id });
  }

  static async setReferencePages(id: number, referencePages: number | null) {
    return db<Book>('book').where({ id }).update({ reference_pages: referencePages });
  }
}
