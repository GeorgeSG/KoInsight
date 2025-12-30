import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../knex';
import { AnnotationsRepository } from './annotations-repository';
import { createBook } from '../db/factories/book-factory';
import { createDevice } from '../db/factories/device-factory';
import { createAnnotation } from '../db/factories/annotation-factory';
import { Book, Device, Annotation } from '@koinsight/common/types';

describe('AnnotationsRepository - Soft Delete', () => {
  let book: Book;
  let device: Device;

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

  describe('markAsDeleted', () => {
    it('should soft delete an annotation by setting deleted_at', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight');

      await AnnotationsRepository.markAsDeleted(annotation.id);

      const updated = await db('annotation').where({ id: annotation.id }).first();
      expect(updated.deleted_at).toBeTruthy();
      expect(updated.deleted_at).not.toBeNull();
    });

    it('should return number of affected rows', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight');

      const count = await AnnotationsRepository.markAsDeleted(annotation.id);

      expect(count).toBe(1);
    });
  });

  describe('markManyAsDeleted', () => {
    it('should soft delete multiple annotations by their identifiers', async () => {
      const annotation1 = await createAnnotation(db, book, device, 'highlight', {
        page_ref: '10',
        datetime: '2024-01-01 10:00:00',
      });
      const annotation2 = await createAnnotation(db, book, device, 'note', {
        page_ref: '20',
        datetime: '2024-01-01 11:00:00',
      });
      const annotation3 = await createAnnotation(db, book, device, 'bookmark', {
        page_ref: '30',
        datetime: '2024-01-01 12:00:00',
      });

      const identifiers = [
        { page_ref: '10', datetime: '2024-01-01 10:00:00' },
        { page_ref: '20', datetime: '2024-01-01 11:00:00' },
      ];

      await AnnotationsRepository.markManyAsDeleted(book.md5, device.id, identifiers);

      const deleted1 = await db('annotation').where({ id: annotation1.id }).first();
      const deleted2 = await db('annotation').where({ id: annotation2.id }).first();
      const notDeleted = await db('annotation').where({ id: annotation3.id }).first();

      expect(deleted1.deleted_at).toBeTruthy();
      expect(deleted2.deleted_at).toBeTruthy();
      expect(notDeleted.deleted_at).toBeNull();
    });

    it('should not mark already deleted annotations', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight', {
        page_ref: '10',
        datetime: '2024-01-01 10:00:00',
      });

      // First deletion
      await AnnotationsRepository.markAsDeleted(annotation.id);
      const firstDeleted = await db('annotation').where({ id: annotation.id }).first();
      const firstDeletedAt = firstDeleted.deleted_at;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Try to delete again
      const identifiers = [{ page_ref: '10', datetime: '2024-01-01 10:00:00' }];
      await AnnotationsRepository.markManyAsDeleted(book.md5, device.id, identifiers);

      const secondDeleted = await db('annotation').where({ id: annotation.id }).first();
      
      // deleted_at should not have changed
      expect(secondDeleted.deleted_at).toBe(firstDeletedAt);
    });

    it('should return 0 when identifiers array is empty', async () => {
      const count = await AnnotationsRepository.markManyAsDeleted(book.md5, device.id, []);
      expect(count).toBe(0);
    });

    it('should work within a transaction', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight', {
        page_ref: '10',
        datetime: '2024-01-01 10:00:00',
      });

      await db.transaction(async (trx) => {
        const identifiers = [{ page_ref: '10', datetime: '2024-01-01 10:00:00' }];
        await AnnotationsRepository.markManyAsDeleted(book.md5, device.id, identifiers, trx);
      });

      const deleted = await db('annotation').where({ id: annotation.id }).first();
      expect(deleted.deleted_at).toBeTruthy();
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted annotation', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight');
      await AnnotationsRepository.markAsDeleted(annotation.id);

      await AnnotationsRepository.restore(annotation.id);

      const restored = await db('annotation').where({ id: annotation.id }).first();
      expect(restored.deleted_at).toBeNull();
    });

    it('should return number of affected rows', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight');
      await AnnotationsRepository.markAsDeleted(annotation.id);

      const count = await AnnotationsRepository.restore(annotation.id);

      expect(count).toBe(1);
    });
  });

  describe('getByBookMd5 with soft delete', () => {
    it('should filter out deleted annotations by default', async () => {
      const annotation1 = await createAnnotation(db, book, device, 'highlight');
      const annotation2 = await createAnnotation(db, book, device, 'note');
      await AnnotationsRepository.markAsDeleted(annotation2.id);

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5);

      expect(annotations).toHaveLength(1);
      expect(annotations[0].id).toBe(annotation1.id);
    });

    it('should include deleted annotations when includeDeleted is true', async () => {
      const annotation1 = await createAnnotation(db, book, device, 'highlight');
      const annotation2 = await createAnnotation(db, book, device, 'note');
      await AnnotationsRepository.markAsDeleted(annotation2.id);

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5, undefined, true);

      expect(annotations).toHaveLength(2);
    });

    it('should filter by device and exclude deleted', async () => {
      const device2 = await createDevice(db, { id: 'device-2', model: 'Another Device' });
      
      await createAnnotation(db, book, device, 'highlight');
      const annotation2 = await createAnnotation(db, book, device, 'note');
      await createAnnotation(db, book, device2, 'bookmark');
      
      await AnnotationsRepository.markAsDeleted(annotation2.id);

      const annotations = await AnnotationsRepository.getByBookMd5(book.md5, device.id);

      expect(annotations).toHaveLength(1);
      expect(annotations[0].device_id).toBe(device.id);
    });
  });

  describe('delete (hard delete)', () => {
    it('should permanently delete an annotation', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight');

      await AnnotationsRepository.delete(annotation.id);

      const deleted = await db('annotation').where({ id: annotation.id }).first();
      expect(deleted).toBeUndefined();
    });

    it('should work on soft-deleted annotations', async () => {
      const annotation = await createAnnotation(db, book, device, 'highlight');
      await AnnotationsRepository.markAsDeleted(annotation.id);

      await AnnotationsRepository.delete(annotation.id);

      const deleted = await db('annotation').where({ id: annotation.id }).first();
      expect(deleted).toBeUndefined();
    });
  });

  describe('getCountsByType with soft delete', () => {
    it('should exclude deleted annotations from counts', async () => {
      // Create 3 highlights, 2 notes, 2 bookmarks
      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device, 'highlight');
      const deletedHighlight = await createAnnotation(db, book, device, 'highlight');
      
      await createAnnotation(db, book, device, 'note');
      const deletedNote = await createAnnotation(db, book, device, 'note');
      
      await createAnnotation(db, book, device, 'bookmark');
      await createAnnotation(db, book, device, 'bookmark');

      // Delete one highlight and one note
      await AnnotationsRepository.markAsDeleted(deletedHighlight.id);
      await AnnotationsRepository.markAsDeleted(deletedNote.id);

      const counts = await AnnotationsRepository.getCountsByType(book.md5);

      expect(counts.highlight).toBe(2); // 3 - 1 deleted
      expect(counts.note).toBe(1); // 2 - 1 deleted
      expect(counts.bookmark).toBe(2); // 2 - 0 deleted
    });

    it('should return zero for types with all annotations deleted', async () => {
      const annotation1 = await createAnnotation(db, book, device, 'highlight');
      const annotation2 = await createAnnotation(db, book, device, 'highlight');

      await AnnotationsRepository.markAsDeleted(annotation1.id);
      await AnnotationsRepository.markAsDeleted(annotation2.id);

      const counts = await AnnotationsRepository.getCountsByType(book.md5);

      expect(counts.highlight).toBe(0);
      expect(counts.note).toBe(0);
      expect(counts.bookmark).toBe(0);
    });
  });
});
