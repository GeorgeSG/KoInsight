import { Annotation, AnnotationType, Book, Device } from '@koinsight/common/types';
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';

type FakeAnnotation = Omit<Annotation, 'id' | 'created_at' | 'updated_at'>;

export function fakeAnnotation(
  book: Book,
  device: Device,
  type: AnnotationType = 'highlight',
  overrides: Partial<FakeAnnotation> = {}
): FakeAnnotation {
  const baseAnnotation: Partial<FakeAnnotation> = {
    book_md5: book.md5,
    device_id: device.id,
    annotation_type: type,
    chapter: faker.lorem.words(3),
    pageno: faker.number.int({ min: 1, max: 500 }),
    page_ref: String(faker.number.int({ min: 1, max: 500 })),
    datetime: faker.date.past().toISOString(),
    datetime_updated: faker.date.recent().toISOString(),
  };

  // Add type-specific fields
  if (type === 'highlight' || type === 'note') {
    baseAnnotation.text = faker.lorem.paragraph();
    baseAnnotation.drawer = faker.helpers.arrayElement(['lighten', 'underscore', 'invert']);
    baseAnnotation.color = faker.helpers.arrayElement(['yellow', 'red', 'blue', 'green']);
    baseAnnotation.pos0 = JSON.stringify({
      x: faker.number.int({ min: 0, max: 800 }),
      y: faker.number.int({ min: 0, max: 600 }),
      page: faker.number.int({ min: 1, max: 500 }),
    });
    baseAnnotation.pos1 = JSON.stringify({
      x: faker.number.int({ min: 0, max: 800 }),
      y: faker.number.int({ min: 0, max: 600 }),
      page: faker.number.int({ min: 1, max: 500 }),
    });
  }

  if (type === 'note') {
    baseAnnotation.note = faker.lorem.sentence();
  }

  if (type === 'bookmark') {
    baseAnnotation.note = faker.lorem.sentence();
    // Bookmarks don't have text, drawer, color, or positions
    delete baseAnnotation.text;
    delete baseAnnotation.drawer;
    delete baseAnnotation.color;
    delete baseAnnotation.pos0;
    delete baseAnnotation.pos1;
  }

  return {
    ...baseAnnotation,
    ...overrides,
  } as FakeAnnotation;
}

export async function createAnnotation(
  db: Knex,
  book: Book,
  device: Device,
  type: AnnotationType = 'highlight',
  overrides: Partial<FakeAnnotation> = {}
): Promise<Annotation> {
  const annotationData = fakeAnnotation(book, device, type, overrides);
  const [annotation] = await db<Annotation>('annotation').insert(annotationData).returning('*');

  return annotation;
}
