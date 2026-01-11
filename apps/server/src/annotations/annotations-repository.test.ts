import { Annotation, Book, Device, KoReaderAnnotation } from '@koinsight/common/types';
import { createAnnotation } from '../db/factories/annotation-factory';
import { createBook } from '../db/factories/book-factory';
import { createDevice } from '../db/factories/device-factory';
import { db } from '../knex';
import { AnnotationsRepository } from './annotations-repository';

describe('AnnotationsRepository', () => {
  let book: Book;
  let device: Device;

  beforeEach(async () => {
    book = await createBook(db);
    device = await createDevice(db);
  });

  describe('getByBookMd5', () => {
    it('returns all annotations for a book', async () => {
      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device, 'note');
      await createAnnotation(db, book, device, 'bookmark');

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);

      expect(annotations).toHaveLength(3);
      expect(annotations[0].book_md5).toBe(book.md5);
    });

    it('returns empty array when no annotations exist', async () => {
      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);
      expect(annotations).toHaveLength(0);
    });

    it('filters by device when deviceId is provided', async () => {
      const device2 = await createDevice(db);

      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device2, 'highlight');

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5, device.id);

      expect(annotations).toHaveLength(1);
      expect(annotations[0].device_id).toBe(device.id);
    });

    it('parses JSON position data', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight');

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);

      expect(annotations[0].pos0).toBeDefined();
      expect(typeof annotations[0].pos0).toBe('object');
      expect(annotations[0].pos0).toHaveProperty('x');
      expect(annotations[0].pos0).toHaveProperty('y');
      expect(annotations[0].pos0).toHaveProperty('page');
    });

    it('orders by datetime descending', async () => {
      await createAnnotation(db, book, device, 'highlight', {
        datetime: '2024-01-01T10:00:00',
      });
      await createAnnotation(db, book, device, 'highlight', {
        datetime: '2024-01-02T10:00:00',
      });
      await createAnnotation(db, book, device, 'highlight', {
        datetime: '2024-01-03T10:00:00',
      });

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);

      expect(annotations[0].datetime).toBe('2024-01-03T10:00:00');
      expect(annotations[1].datetime).toBe('2024-01-02T10:00:00');
      expect(annotations[2].datetime).toBe('2024-01-01T10:00:00');
    });
  });

  describe('getByType', () => {
    it('returns only highlights', async () => {
      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device, 'note');
      await createAnnotation(db, book, device, 'bookmark');

      const highlights = await AnnotationsRepository.getByType(book.md5, 'highlight');

      expect(highlights).toHaveLength(1);
      expect(highlights[0].annotation_type).toBe('highlight');
    });

    it('returns only notes', async () => {
      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device, 'note');
      await createAnnotation(db, book, device, 'bookmark');

      const notes = await AnnotationsRepository.getByType(book.md5, 'note');

      expect(notes).toHaveLength(1);
      expect(notes[0].annotation_type).toBe('note');
    });

    it('returns only bookmarks', async () => {
      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device, 'note');
      await createAnnotation(db, book, device, 'bookmark');

      const bookmarks = await AnnotationsRepository.getByType(book.md5, 'bookmark');

      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].annotation_type).toBe('bookmark');
    });

    it('filters by device when provided', async () => {
      const device2 = await createDevice(db);

      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device2, 'highlight');

      const highlights = await AnnotationsRepository.getByType(book.md5, 'highlight', device.id);

      expect(highlights).toHaveLength(1);
      expect(highlights[0].device_id).toBe(device.id);
    });
  });

  describe('getByDeviceId', () => {
    it('returns all annotations for a device', async () => {
      const book2 = await createBook(db);

      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book2, device, 'note');

      const annotations = await AnnotationsRepository.getByDeviceId(device.id);

      expect(annotations).toHaveLength(2);
      expect(annotations[0].device_id).toBe(device.id);
      expect(annotations[1].device_id).toBe(device.id);
    });

    it('returns empty array when device has no annotations', async () => {
      const device2 = await createDevice(db);
      const annotations = await AnnotationsRepository.getByDeviceId(device2.id);
      expect(annotations).toHaveLength(0);
    });
  });

  describe('bulkInsert', () => {
    it('inserts multiple KoReader annotations', async () => {
      const koreaderAnnotations: KoReaderAnnotation[] = [
        {
          datetime: '2024-01-15T10:30:45',
          drawer: 'lighten',
          color: 'yellow',
          text: 'Highlighted text 1',
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
          text: 'Highlighted text 2',
          note: 'My note',
          chapter: 'Chapter 2',
          pageno: 20,
          page: 20,
          pos0: { x: 100, y: 300, page: 20 },
          pos1: { x: 400, y: 320, page: 20 },
        },
      ];

      await AnnotationsRepository.bulkInsert(book.md5, device.id, koreaderAnnotations);

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);

      expect(annotations).toHaveLength(2);
      expect(annotations[0].text).toBe('Highlighted text 2');
      expect(annotations[1].text).toBe('Highlighted text 1');
    });

    it('handles empty array', async () => {
      await AnnotationsRepository.bulkInsert(book.md5, device.id, []);
      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);
      expect(annotations).toHaveLength(0);
    });

    it('merges on conflict (upsert)', async () => {
      const koreaderAnnotation: KoReaderAnnotation = {
        datetime: '2024-01-15T10:30:45',
        drawer: 'lighten',
        color: 'yellow',
        text: 'Original text',
        chapter: 'Chapter 1',
        pageno: 10,
        page: 10,
        pos0: { x: 100, y: 200, page: 10 },
        pos1: { x: 400, y: 220, page: 10 },
      };

      // Insert first time
      await AnnotationsRepository.bulkInsert(book.md5, device.id, [koreaderAnnotation]);

      // Update with new text
      const updatedAnnotation = {
        ...koreaderAnnotation,
        text: 'Updated text',
        datetime_updated: '2024-01-16T10:00:00',
      };

      await AnnotationsRepository.bulkInsert(book.md5, device.id, [updatedAnnotation]);

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);

      expect(annotations).toHaveLength(1);
      expect(annotations[0].text).toBe('Updated text');
      expect(annotations[0].datetime_updated).toBe('2024-01-16T10:00:00');
    });

    it('preserves pageno and total_pages on update (immutable historical data)', async () => {
      const koreaderAnnotation: KoReaderAnnotation = {
        datetime: '2024-01-15T10:30:45',
        drawer: 'lighten',
        color: 'yellow',
        text: 'Original text',
        chapter: 'Chapter 1',
        pageno: 407,
        page: 10,
        total_pages: 1802,
        pos0: { x: 100, y: 200, page: 10 },
        pos1: { x: 400, y: 220, page: 10 },
      };

      // Insert first time with pageno: 407, total_pages: 1802
      await AnnotationsRepository.bulkInsert(book.md5, device.id, [koreaderAnnotation]);

      // Simulate KoReader sending wrong/updated pageno (e.g., after reflow or bug)
      const updatedAnnotation = {
        ...koreaderAnnotation,
        text: 'Updated text',
        note: 'Added note',
        pageno: 373, // ❌ Different pageno (bug or reflow)
        total_pages: 2000, // ❌ Different total_pages
        datetime_updated: '2024-01-16T10:00:00',
      };

      await AnnotationsRepository.bulkInsert(book.md5, device.id, [updatedAnnotation]);

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);

      expect(annotations).toHaveLength(1);
      // These should be updated (user-editable fields)
      expect(annotations[0].text).toBe('Updated text');
      expect(annotations[0].note).toBe('Added note');
      expect(annotations[0].datetime_updated).toBe('2024-01-16T10:00:00');
      // These MUST be preserved (immutable historical data)
      expect(annotations[0].pageno).toBe(407); // ✓ Original pageno preserved!
      expect(annotations[0].total_pages).toBe(1802); // ✓ Original total_pages preserved!
    });

    it('correctly identifies annotation types', async () => {
      const koreaderAnnotations: KoReaderAnnotation[] = [
        {
          datetime: '2024-01-15T10:30:45',
          drawer: 'lighten',
          color: 'yellow',
          text: 'Highlight only',
          chapter: 'Chapter 1',
          pageno: 10,
          page: 10,
          pos0: { x: 100, y: 200, page: 10 },
          pos1: { x: 400, y: 220, page: 10 },
        },
        {
          datetime: '2024-01-15T11:00:00',
          drawer: 'lighten',
          color: 'yellow',
          text: 'Highlight with note',
          note: 'This is a note',
          chapter: 'Chapter 2',
          pageno: 20,
          page: 20,
          pos0: { x: 100, y: 300, page: 20 },
          pos1: { x: 400, y: 320, page: 20 },
        },
        {
          datetime: '2024-01-15T12:00:00',
          note: 'Bookmark note',
          chapter: 'Chapter 3',
          pageno: 30,
          page: 30,
        },
      ];

      await AnnotationsRepository.bulkInsert(book.md5, device.id, koreaderAnnotations);

      const highlights = await AnnotationsRepository.getByType(book.md5, 'highlight');
      const notes = await AnnotationsRepository.getByType(book.md5, 'note');
      const bookmarks = await AnnotationsRepository.getByType(book.md5, 'bookmark');

      expect(highlights).toHaveLength(1);
      expect(notes).toHaveLength(1);
      expect(bookmarks).toHaveLength(1);
    });
  });

  describe('insert', () => {
    it('inserts a single annotation', async () => {
      const annotation = await AnnotationsRepository.insert({
        book_md5: book.md5,
        device_id: device.id,
        annotation_type: 'highlight',
        text: 'Test highlight',
        drawer: 'lighten',
        color: 'yellow',
        page_ref: '10',
        datetime: '2024-01-15T10:30:45',
      });

      expect(annotation.id).toBeDefined();
      expect(annotation.text).toBe('Test highlight');
    });

    it('handles position objects', async () => {
      const annotation = await AnnotationsRepository.insert({
        book_md5: book.md5,
        device_id: device.id,
        annotation_type: 'highlight',
        text: 'Test highlight',
        pos0: { x: 100, y: 200, page: 10 },
        pos1: { x: 400, y: 220, page: 10 },
        page_ref: '10',
        datetime: '2024-01-15T10:30:45',
      });

      expect(annotation.pos0).toBeDefined();
      expect(typeof annotation.pos0).toBe('object');
    });
  });

  describe('update', () => {
    it('updates an annotation', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight', {
        text: 'Original text',
      });

      await AnnotationsRepository.update(annotation.id, {
        text: 'Updated text',
        note: 'Added note',
      });

      const updated = await db<Annotation>('annotation').where({ id: annotation.id }).first();

      expect(updated?.text).toBe('Updated text');
      expect(updated?.note).toBe('Added note');
    });

    it('returns 0 when annotation not found', async () => {
      const result = await AnnotationsRepository.update(999, { text: 'New text' });
      expect(result).toBe(0);
    });
  });

  describe('delete', () => {
    it('deletes an annotation', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight');

      const result = await AnnotationsRepository.delete(annotation.id);

      expect(result).toBe(1);

      const found = await db<Annotation>('annotation').where({ id: annotation.id }).first();
      expect(found).toBeUndefined();
    });

    it('returns 0 when annotation not found', async () => {
      const result = await AnnotationsRepository.delete(999);
      expect(result).toBe(0);
    });
  });

  describe('deleteByBookMd5', () => {
    it('deletes all annotations for a book', async () => {
      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device, 'note');
      await createAnnotation(db, book, device, 'bookmark');

      const result = await AnnotationsRepository.deleteByBookMd5(book.md5);

      expect(result).toBe(3);

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);
      expect(annotations).toHaveLength(0);
    });

    it('returns 0 when no annotations exist', async () => {
      const result = await AnnotationsRepository.deleteByBookMd5(book.md5);
      expect(result).toBe(0);
    });
  });

  describe('getCountsByType', () => {
    it('returns counts for all types', async () => {
      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device, 'note');
      await createAnnotation(db, book, device, 'bookmark');
      await createAnnotation(db, book, device, 'bookmark');
      await createAnnotation(db, book, device, 'bookmark');

      const counts = await AnnotationsRepository.getCountsByType(book.md5);

      expect(counts.highlight).toBe(2);
      expect(counts.note).toBe(1);
      expect(counts.bookmark).toBe(3);
    });

    it('returns zeros when no annotations exist', async () => {
      const counts = await AnnotationsRepository.getCountsByType(book.md5);

      expect(counts.highlight).toBe(0);
      expect(counts.note).toBe(0);
      expect(counts.bookmark).toBe(0);
    });

    it('returns zeros for missing types', async () => {
      await createAnnotation(db, book, device, 'highlight');

      const counts = await AnnotationsRepository.getCountsByType(book.md5);

      expect(counts.highlight).toBe(1);
      expect(counts.note).toBe(0);
      expect(counts.bookmark).toBe(0);
    });
  });
});
