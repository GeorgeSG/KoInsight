import { Book } from '@koinsight/common/types';
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';

type FakeBook = Omit<Book, 'id'>;

export function fakeBook(overrides: Partial<FakeBook> = {}): FakeBook {
  const book: FakeBook = {
    title: faker.book.title(),
    md5: faker.string.alphanumeric(32),
    reference_pages: faker.number.int({ min: 50, max: 1000 }),
    authors: faker.book.author(),
    series: faker.book.series(),
    language: faker.location.language().alpha2,
    soft_deleted: false,
    status: null,
    ...overrides,
  };

  return book;
}

export async function createBook(db: Knex, overrides: Partial<FakeBook> = {}): Promise<Book> {
  const bookData = fakeBook(overrides);
  const [book] = await db<Book>('book').insert(bookData).returning('*');

  return book;
}
