import { Annotation, AnnotationType, Book, Device } from '@koinsight/common/types';
import { subDays, subHours } from 'date-fns';
import { Knex } from 'knex';
import { db } from '../../knex';
import { createAnnotation } from '../factories/annotation-factory';
import { SEEDED_BOOKS } from './02_books';
import { SEEDED_DEVICES } from './01_devices';

/**
 * Generate realistic annotations for a book
 * - 5-15 highlights per book
 * - 2-5 notes per book
 * - 3-8 bookmarks per book
 */
function generateAnnotationsForBook(book: Book, device: Device): Promise<Annotation>[] {
  const promises: Promise<Annotation>[] = [];
  const today = new Date();

  // Determine how many pages have been read based on reference_pages
  const totalPages = book.reference_pages ?? 300;
  const readProgress = Math.random() * 0.8 + 0.2; // 20-100% read
  const maxPage = Math.floor(totalPages * readProgress);

  // Track used page/datetime combinations to avoid duplicates
  const usedCombinations = new Set<string>();

  // Helper to generate unique datetime for a page
  const getUniqueDateTime = (pageno: number, daysAgo: number): string => {
    let datetime = subDays(today, daysAgo).toISOString();
    let key = `${pageno}-${datetime}`;
    let attempts = 0;

    // If this combination exists, add some hours to make it unique
    while (usedCombinations.has(key) && attempts < 100) {
      datetime = subHours(new Date(datetime), Math.floor(Math.random() * 24) + 1).toISOString();
      key = `${pageno}-${datetime}`;
      attempts++;
    }

    usedCombinations.add(key);
    return datetime;
  };

  // Generate highlights (5-15 per book)
  const numHighlights = Math.floor(Math.random() * 11) + 5;
  for (let i = 0; i < numHighlights; i++) {
    const daysAgo = Math.floor(Math.random() * 30); // Within last 30 days
    const pageno = Math.floor(Math.random() * maxPage) + 1;
    const datetime = getUniqueDateTime(pageno, daysAgo);

    promises.push(
      createAnnotation(db, book, device, 'highlight', {
        pageno,
        page_ref: String(pageno),
        datetime,
        datetime_updated: subDays(new Date(datetime), -1).toISOString(),
        chapter: `Chapter ${Math.floor(pageno / 20) + 1}`,
        total_pages: totalPages,
        drawer: ['lighten', 'underscore', 'invert'][Math.floor(Math.random() * 3)] as any,
        color: ['red', 'orange', 'yellow', 'green', 'olive', 'cyan', 'blue', 'purple', 'gray'][
          Math.floor(Math.random() * 4)
        ] as any,
      })
    );
  }

  // Generate notes (2-5 per book)
  const numNotes = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < numNotes; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const pageno = Math.floor(Math.random() * maxPage) + 1;
    const datetime = getUniqueDateTime(pageno, daysAgo);

    promises.push(
      createAnnotation(db, book, device, 'note', {
        pageno,
        page_ref: String(pageno),
        datetime,
        datetime_updated: subDays(new Date(datetime), -1).toISOString(),
        chapter: `Chapter ${Math.floor(pageno / 20) + 1}`,
        total_pages: totalPages,
        color: ['yellow', 'red', 'blue', 'green'][Math.floor(Math.random() * 4)] as any,
      })
    );
  }

  // Generate bookmarks (3-8 per book)
  const numBookmarks = Math.floor(Math.random() * 6) + 3;
  for (let i = 0; i < numBookmarks; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const pageno = Math.floor(Math.random() * maxPage) + 1;
    const datetime = getUniqueDateTime(pageno, daysAgo);

    promises.push(
      createAnnotation(db, book, device, 'bookmark', {
        pageno,
        page_ref: String(pageno),
        datetime,
        datetime_updated: subDays(new Date(datetime), -1).toISOString(),
        chapter: `Chapter ${Math.floor(pageno / 20) + 1}`,
        total_pages: totalPages,
      })
    );
  }

  return promises;
}

export let SEEDED_ANNOTATIONS: Annotation[] = [];

export async function seed(knex: Knex): Promise<void> {
  await knex('annotation').del();

  const promises: Promise<Annotation>[] = [];

  // Generate annotations for each book
  SEEDED_BOOKS.forEach((book) => {
    // Use a random device for each book (simulating different reading devices)
    const device = SEEDED_DEVICES[Math.floor(Math.random() * SEEDED_DEVICES.length)];
    promises.push(...generateAnnotationsForBook(book, device));
  });

  SEEDED_ANNOTATIONS = await Promise.all(promises);

  console.log(`✓ Seeded ${SEEDED_ANNOTATIONS.length} annotations`);
}
