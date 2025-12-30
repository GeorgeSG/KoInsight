import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../knex';
import { UploadService } from './upload-service';
import { AnnotationsRepository } from '../annotations/annotations-repository';
import { createBook } from '../db/factories/book-factory';
import { createDevice } from '../db/factories/device-factory';
import { createAnnotation } from '../db/factories/annotation-factory';
import { Book, Device, KoReaderBook, PageStat, KoReaderAnnotation } from '@koinsight/common/types';

describe('UploadService - Soft Delete', () => {
  let book: Book;
  let device: Device;
  let koreaderBook: KoReaderBook;
  let pageStats: PageStat[];

  beforeEach(async () => {
    await db.raw('PRAGMA foreign_keys = OFF');
    await db('annotation').del();
    await db('page_stat').del();
    await db('book_device').del();
    await db('book').del();
    await db('device').del();
    await db.raw('PRAGMA foreign_keys = ON');

    book = await createBook(db);
    device = await createDevice(db);

    koreaderBook = {
      id: book.id!,
      md5: book.md5,
      title: book.title,
      authors: book.authors || 'Unknown',
      series: book.series,
      language: book.language,
      last_open: Date.now(),
      pages: 100,
      notes: 0,
      highlights: 0,
      total_read_pages: 10,
      total_read_time: 600,
    };

    pageStats = [
      {
        book_md5: book.md5,
        device_id: device.id,
        page: 1,
        start_time: Date.now() - 1000,
        duration: 100,
        total_pages: 100,
      },
    ];
  });

  afterEach(async () => {
    await db.raw('PRAGMA foreign_keys = OFF');
    await db('annotation').del();
    await db('page_stat').del();
    await db('book_device').del();
    await db('book').del();
    await db('device').del();
    await db.raw('PRAGMA foreign_keys = ON');
  });

  describe('detectAndMarkDeletedAnnotations', () => {
    it('should mark annotations as deleted when they are missing from sync', async () => {
      // Create 3 annotations in the database
      await createAnnotation(db, book, device, 'highlight', {
        page_ref: '10',
        datetime: '2024-01-01 10:00:00',
      });
      await createAnnotation(db, book, device, 'note', {
        page_ref: '20',
        datetime: '2024-01-01 11:00:00',
      });
      await createAnnotation(db, book, device, 'bookmark', {
        page_ref: '30',
        datetime: '2024-01-01 12:00:00',
      });

      // Sync only includes 2 annotations (one is missing = deleted in KoReader)
      const syncedAnnotations: KoReaderAnnotation[] = [
        {
          page: '10',
          datetime: '2024-01-01 10:00:00',
          text: 'Highlight text',
          drawer: 'lighten',
          color: 'yellow',
        },
        {
          page: '30',
          datetime: '2024-01-01 12:00:00',
        },
      ];

      const annotationsByBook = {
        [book.md5]: syncedAnnotations,
      };

      await UploadService.uploadStatisticData(
        [koreaderBook],
        pageStats,
        annotationsByBook,
        true // syncAnnotationDeletions enabled
      );

      // Check that the missing annotation was marked as deleted
      const allAnnotations = await db('annotation')
        .where({ book_md5: book.md5, device_id: device.id })
        .orderBy('page_ref');

      expect(allAnnotations).toHaveLength(3);
      expect(allAnnotations[0].deleted_at).toBeNull(); // page 10 - not deleted
      expect(allAnnotations[1].deleted_at).toBeTruthy(); // page 20 - deleted!
      expect(allAnnotations[2].deleted_at).toBeNull(); // page 30 - not deleted
    });

    it('should not mark annotations as deleted when syncAnnotationDeletions is false', async () => {
      // Create 2 annotations in the database
      await createAnnotation(db, book, device, 'highlight', {
        page_ref: '10',
        datetime: '2024-01-01 10:00:00',
      });
      await createAnnotation(db, book, device, 'note', {
        page_ref: '20',
        datetime: '2024-01-01 11:00:00',
      });

      // Sync only includes 1 annotation
      const syncedAnnotations: KoReaderAnnotation[] = [
        {
          page: '10',
          datetime: '2024-01-01 10:00:00',
          text: 'Highlight text',
          drawer: 'lighten',
          color: 'yellow',
        },
      ];

      const annotationsByBook = {
        [book.md5]: syncedAnnotations,
      };

      await UploadService.uploadStatisticData(
        [koreaderBook],
        pageStats,
        annotationsByBook,
        false // syncAnnotationDeletions disabled
      );

      // Check that NO annotations were marked as deleted
      const allAnnotations = await db('annotation').where({
        book_md5: book.md5,
        device_id: device.id,
      });

      expect(allAnnotations).toHaveLength(2);
      expect(allAnnotations[0].deleted_at).toBeNull();
      expect(allAnnotations[1].deleted_at).toBeNull();
    });

    it('should not re-delete already deleted annotations', async () => {
      // Create and immediately delete an annotation
      const annotation = await createAnnotation(db, book, device, 'highlight', {
        page_ref: '10',
        datetime: '2024-01-01 10:00:00',
      });
      await AnnotationsRepository.markAsDeleted(annotation.id);

      const firstDeleted = await db('annotation').where({ id: annotation.id }).first();
      const firstDeletedAt = firstDeleted.deleted_at;

      // Sync with empty annotations (all deleted in KoReader)
      const syncedAnnotations: KoReaderAnnotation[] = [];

      const annotationsByBook = {
        [book.md5]: syncedAnnotations,
      };

      await UploadService.uploadStatisticData(
        [koreaderBook],
        pageStats,
        annotationsByBook,
        true
      );

      // Check that deleted_at timestamp didn't change
      const secondDeleted = await db('annotation').where({ id: annotation.id }).first();
      expect(secondDeleted.deleted_at).toBe(firstDeletedAt);
    });

    it('should handle new annotations and deletions in the same sync', async () => {
      // Create one existing annotation
      await createAnnotation(db, book, device, 'highlight', {
        page_ref: '10',
        datetime: '2024-01-01 10:00:00',
      });

      // Sync includes a new annotation, but not the existing one
      const syncedAnnotations: KoReaderAnnotation[] = [
        {
          page: '20',
          datetime: '2024-01-01 11:00:00',
          text: 'New highlight',
          drawer: 'lighten',
          color: 'yellow',
        },
      ];

      const annotationsByBook = {
        [book.md5]: syncedAnnotations,
      };

      await UploadService.uploadStatisticData(
        [koreaderBook],
        pageStats,
        annotationsByBook,
        true
      );

      const allAnnotations = await db('annotation')
        .where({ book_md5: book.md5, device_id: device.id })
        .orderBy('page_ref');

      expect(allAnnotations).toHaveLength(2);
      expect(allAnnotations[0].page_ref).toBe('10');
      expect(allAnnotations[0].deleted_at).toBeTruthy(); // Old one deleted
      expect(allAnnotations[1].page_ref).toBe('20');
      expect(allAnnotations[1].deleted_at).toBeNull(); // New one active
    });

    it('should handle multiple books correctly', async () => {
      const book2 = await createBook(db, { md5: 'book2md5', title: 'Book 2' });

      // Create annotations for both books
      await createAnnotation(db, book, device, 'highlight', {
        page_ref: '10',
        datetime: '2024-01-01 10:00:00',
      });
      await createAnnotation(db, book2, device, 'highlight', {
        page_ref: '10',
        datetime: '2024-01-01 10:00:00',
      });

      // Sync only book1's annotations (book2's annotation should be deleted)
      const syncedAnnotations: KoReaderAnnotation[] = [
        {
          page: '10',
          datetime: '2024-01-01 10:00:00',
          text: 'Highlight text',
          drawer: 'lighten',
          color: 'yellow',
        },
      ];

      const koreaderBook2: KoReaderBook = {
        ...koreaderBook,
        id: book2.id!,
        md5: book2.md5,
        title: book2.title,
      };

      const annotationsByBook = {
        [book.md5]: syncedAnnotations,
        [book2.md5]: [], // Empty = all deleted
      };

      await UploadService.uploadStatisticData(
        [koreaderBook, koreaderBook2],
        [
          ...pageStats,
          {
            book_md5: book2.md5,
            device_id: device.id,
            page: 1,
            start_time: Date.now() - 1000,
            duration: 100,
            total_pages: 100,
          },
        ],
        annotationsByBook,
        true
      );

      const book1Annotations = await db('annotation').where({ book_md5: book.md5 });
      const book2Annotations = await db('annotation').where({ book_md5: book2.md5 });

      expect(book1Annotations[0].deleted_at).toBeNull(); // Not deleted
      expect(book2Annotations[0].deleted_at).toBeTruthy(); // Deleted
    });
  });
});
