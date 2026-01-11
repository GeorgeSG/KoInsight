import { Book, Device } from '@koinsight/common/types';
import { createAnnotation } from '../db/factories/annotation-factory';
import { createBook } from '../db/factories/book-factory';
import { createDevice } from '../db/factories/device-factory';
import { db } from '../knex';
import { BooksService } from './books-service';

describe('BooksService with annotations', () => {
  let book: Book;
  let device: Device;

  beforeEach(async () => {
    book = await createBook(db);
    device = await createDevice(db);
  });

  describe('withData', () => {
    it('includes annotations in the response', async () => {
      // Create some test annotations
      await createAnnotation(db, book, device, 'highlight', {
        text: 'Important quote from the book',
        chapter: 'Chapter 5',
        pageno: 42,
      });
      
      await createAnnotation(db, book, device, 'note', {
        text: 'Another highlight',
        note: 'My thoughts on this passage',
        chapter: 'Chapter 10',
        pageno: 100,
      });
      
      await createAnnotation(db, book, device, 'bookmark', {
        note: 'Resume reading here',
        chapter: 'Chapter 12',
        pageno: 150,
      });

      const result = await BooksService.withData(book);

      // Check that annotations are included
      expect(result.annotations).toBeDefined();
      expect(result.annotations).toHaveLength(3);

      // Check that counts are correct
      expect(result.highlights_count).toBe(1);
      expect(result.notes_count).toBe(1);
      expect(result.bookmarks_count).toBe(1);

      // Check annotation details
      const highlight = result.annotations.find(a => a.annotation_type === 'highlight');
      expect(highlight).toBeDefined();
      expect(highlight?.text).toBe('Important quote from the book');
      expect(highlight?.chapter).toBe('Chapter 5');

      const note = result.annotations.find(a => a.annotation_type === 'note');
      expect(note).toBeDefined();
      expect(note?.note).toBe('My thoughts on this passage');

      const bookmark = result.annotations.find(a => a.annotation_type === 'bookmark');
      expect(bookmark).toBeDefined();
      expect(bookmark?.pageno).toBe(150);
    });

    it('returns empty annotations when book has none', async () => {
      const result = await BooksService.withData(book);

      expect(result.annotations).toEqual([]);
      expect(result.highlights_count).toBe(0);
      expect(result.notes_count).toBe(0);
      expect(result.bookmarks_count).toBe(0);
    });

    it('handles multiple devices annotations', async () => {
      const device2 = await createDevice(db);

      await createAnnotation(db, book, device, 'highlight');
      await createAnnotation(db, book, device2, 'highlight');
      await createAnnotation(db, book, device2, 'note');

      const result = await BooksService.withData(book);

      expect(result.annotations).toHaveLength(3);
      expect(result.highlights_count).toBe(2);
      expect(result.notes_count).toBe(1);
    });

    it('parses position data correctly', async () => {
      await createAnnotation(db, book, device, 'highlight', {
        pos0: JSON.stringify({ x: 100, y: 200, page: 42 }),
        pos1: JSON.stringify({ x: 400, y: 220, page: 42 }),
      });

      const result = await BooksService.withData(book);

      const highlight = result.annotations[0];
      expect(highlight.pos0).toBeDefined();
      expect(typeof highlight.pos0).toBe('object');
      expect(highlight.pos0).toEqual({ x: 100, y: 200, page: 42 });
      expect(highlight.pos1).toEqual({ x: 400, y: 220, page: 42 });
    });
  });
});
