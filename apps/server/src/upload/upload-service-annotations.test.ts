import { KoReaderAnnotation, KoReaderBook, PageStat } from '@koinsight/common/types';
import { createBook } from '../db/factories/book-factory';
import { createDevice } from '../db/factories/device-factory';
import { db } from '../knex';
import { AnnotationsRepository } from '../annotations/annotations-repository';
import { UploadService } from './upload-service';

describe('UploadService with annotations', () => {
  describe('annotation data structure from KoReader', () => {
    it('can process KoReader annotation format', async () => {
      const device = await createDevice(db);
      const book = await createBook(db, { md5: 'test-book-md5-123' });

      const koreaderAnnotations: KoReaderAnnotation[] = [
        {
          datetime: '2024-01-15T10:30:45',
          drawer: 'lighten',
          color: 'yellow',
          text: 'First highlight from KoReader',
          chapter: 'Chapter 1',
          pageno: 10,
          page: 10,
          pos0: { x: 100, y: 200, page: 10 },
          pos1: { x: 400, y: 220, page: 10 },
        },
        {
          datetime: '2024-01-15T11:00:00',
          drawer: 'underscore',
          color: 'blue',
          text: 'Second highlight',
          note: 'This is important!',
          chapter: 'Chapter 2',
          pageno: 25,
          page: 25,
          pos0: { x: 100, y: 300, page: 25 },
          pos1: { x: 400, y: 320, page: 25 },
        },
        {
          datetime: '2024-01-15T12:00:00',
          note: 'Resume reading here',
          chapter: 'Chapter 5',
          pageno: 50,
          page: 50,
        },
      ];

      // Use AnnotationsRepository directly to test the conversion
      await AnnotationsRepository.bulkInsert(book.md5, device.id, koreaderAnnotations);

      // Verify annotations were imported
      const importedAnnotations = await AnnotationsRepository.getByBookMd5(book.md5);
      expect(importedAnnotations).toHaveLength(3);

      // Verify annotation types
      const counts = await AnnotationsRepository.getCountsByType(book.md5);
      expect(counts.highlight).toBe(1);
      expect(counts.note).toBe(1);
      expect(counts.bookmark).toBe(1);

      // Verify annotation content
      const highlight = importedAnnotations.find((a) => a.annotation_type === 'highlight');
      expect(highlight?.text).toBe('First highlight from KoReader');
      expect(highlight?.color).toBe('yellow');

      const note = importedAnnotations.find((a) => a.annotation_type === 'note');
      expect(note?.note).toBe('This is important!');

      const bookmark = importedAnnotations.find((a) => a.annotation_type === 'bookmark');
      expect(bookmark?.pageno).toBe(50);
    });

    it('updates existing annotations on re-upload', async () => {
      const device = await createDevice(db);
      const book = await createBook(db, { md5: 'update-test-book' });

      const initialAnnotations: KoReaderAnnotation[] = [
        {
          datetime: '2024-01-15T10:00:00',
          drawer: 'lighten',
          color: 'yellow',
          text: 'Original text',
          chapter: 'Chapter 1',
          pageno: 10,
          page: 10,
          pos0: { x: 100, y: 200, page: 10 },
          pos1: { x: 400, y: 220, page: 10 },
        },
      ];

      // First upload
      await AnnotationsRepository.bulkInsert(book.md5, device.id, initialAnnotations);

      let annotations = await AnnotationsRepository.getByBookMd5(book.md5);
      expect(annotations).toHaveLength(1);
      expect(annotations[0].text).toBe('Original text');

      // Update the annotation
      const updatedAnnotations: KoReaderAnnotation[] = [
        {
          datetime: '2024-01-15T10:00:00', // Same datetime = same annotation
          datetime_updated: '2024-01-16T10:00:00',
          drawer: 'lighten',
          color: 'yellow',
          text: 'Updated text', // Changed text
          chapter: 'Chapter 1',
          pageno: 10,
          page: 10,
          pos0: { x: 100, y: 200, page: 10 },
          pos1: { x: 400, y: 220, page: 10 },
        },
      ];

      // Second upload (should update, not duplicate)
      await AnnotationsRepository.bulkInsert(book.md5, device.id, updatedAnnotations);

      annotations = await AnnotationsRepository.getByBookMd5(book.md5);
      expect(annotations).toHaveLength(1); // Still only 1 annotation
      expect(annotations[0].text).toBe('Updated text'); // Text was updated
      expect(annotations[0].datetime_updated).toBe('2024-01-16T10:00:00');
    });
  });
});

describe('UploadService page stat input hardening', () => {
  const makeBook = (md5: string): KoReaderBook => ({
    id: 1,
    md5,
    title: 'Test Book',
    authors: 'Author',
    series: '',
    language: 'en',
    notes: 0,
    highlights: 0,
    last_open: 0,
    pages: 100,
    total_read_time: 0,
    total_read_pages: 0,
  });

  it('succeeds when stats is a non-array object (annotation-only path)', async () => {
    const book = await createBook(db, { md5: 'hardening-test-1' });

    await expect(
      UploadService.uploadStatisticData([makeBook(book.md5)], {} as unknown as PageStat[])
    ).resolves.not.toThrow();

    const rows = await db('page_stat').where({ book_md5: book.md5 });
    expect(rows).toHaveLength(0);
  });

  it('drops null/undefined/non-object entries in stats array', async () => {
    const book = await createBook(db, { md5: 'hardening-test-2' });
    const device = await createDevice(db);

    const statsWithJunk = [
      null,
      undefined,
      'not-an-object',
      42,
      {
        device_id: device.id,
        book_md5: book.md5,
        page: 1,
        start_time: 1000,
        duration: 10,
        total_pages: 100,
      },
    ] as unknown as PageStat[];

    await expect(
      UploadService.uploadStatisticData([makeBook(book.md5)], statsWithJunk)
    ).resolves.not.toThrow();

    const rows = await db('page_stat').where({ book_md5: book.md5 });
    expect(rows).toHaveLength(1);
  });

  it('drops stats with zero or invalid duration/total_pages', async () => {
    const book = await createBook(db, { md5: 'hardening-test-3' });
    const device = await createDevice(db);

    const invalidStats: PageStat[] = [
      {
        device_id: device.id,
        book_md5: book.md5,
        page: 1,
        start_time: 1000,
        duration: 0,
        total_pages: 100,
      },
      {
        device_id: device.id,
        book_md5: book.md5,
        page: 2,
        start_time: 1001,
        duration: 10,
        total_pages: 0,
      },
      {
        device_id: device.id,
        book_md5: book.md5,
        page: 3,
        start_time: 1002,
        duration: -1,
        total_pages: 100,
      },
    ];

    await expect(
      UploadService.uploadStatisticData([makeBook(book.md5)], invalidStats)
    ).resolves.not.toThrow();

    const rows = await db('page_stat').where({ book_md5: book.md5 });
    expect(rows).toHaveLength(0);
  });
});
