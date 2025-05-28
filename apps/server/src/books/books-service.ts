import { Book, BookDevice, BookWithData, PageStat } from '@koinsight/common/types';
import { startOfDay } from 'date-fns';
import { GenreRepository } from '../genres/genre-repository';
import { StatsRepository } from '../stats/stats-repository';
import { BooksRepository } from './books-repository';

export class BooksService {
  static getTotalPages(book: Book, bookDevices: BookDevice[]): number {
    return book.reference_pages || Math.max(...bookDevices.map((device) => device.pages || 0));
  }

  static getTotalReadTime(bookDevices: BookDevice[]): number {
    return bookDevices.reduce((acc, device) => acc + device.total_read_time, 0);
  }

  static getStartedReading(stats: PageStat[]): number {
    return stats.reduce((acc, stat) => Math.min(acc, stat.start_time), Infinity);
  }

  static getLastOpen(bookDevices: BookDevice[]): number {
    return bookDevices.reduce((acc, device) => Math.max(acc, device.last_open), 0);
  }

  static getReadPerDay(stats: PageStat[]): Record<string, number> {
    return stats.reduce(
      (acc, stat) => {
        const day = startOfDay(stat.start_time).getTime();
        acc[day] = (acc[day] || 0) + stat.duration;

        return acc;
      },
      {} as Record<string, number>
    );
  }

  static getTotalReadPages(book: Book, stats: PageStat[]): number {
    const seen_pages = new Set<number>();
    return Math.round(
      stats.reduce((acc, stat) => {
        if (seen_pages.has(stat.page)) {
          return acc;
        }

        seen_pages.add(stat.page);

        if (book.reference_pages) {
          return acc + (1 / stat.total_pages) * book.reference_pages;
        } else {
          return acc + 1;
        }
      }, 0)
    );
  }

  static async withData(book: Book): Promise<BookWithData> {
    const stats = await StatsRepository.getByBookMD5(book.md5);
    const bookDevices = await BooksRepository.getBookDevices(book.md5);
    const genres = await GenreRepository.getByBookMd5(book.md5);

    const total_pages = this.getTotalPages(book, bookDevices);
    const total_read_time = this.getTotalReadTime(bookDevices);
    const started_reading = this.getStartedReading(stats);
    const last_open = this.getLastOpen(bookDevices);
    const read_per_day = this.getReadPerDay(stats);
    const total_read_pages = this.getTotalReadPages(book, stats);

    const response: BookWithData = {
      ...book,
      stats,
      device_data: bookDevices,
      started_reading,
      read_per_day,
      total_read_time,
      total_read_pages,
      total_pages,
      last_open,
      genres,
      notes: bookDevices.reduce((acc, device) => acc + device.notes, 0),
      highlights: bookDevices.reduce((acc, device) => acc + device.highlights, 0),
    };

    return response;
  }
}
