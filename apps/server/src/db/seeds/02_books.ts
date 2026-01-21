import { Book } from '@koinsight/common/types/book';
import { Knex } from 'knex';
import { db } from '../../knex';
import { generateMd5Hash } from '../../utils/strings';
import { createBook } from '../factories/book-factory';

const SEED_BOOKS: Partial<Book>[] = [
  {
    id: 1,
    title: 'Mistborn: The Final Empire',
    authors: 'Brandon Sanderson',
    series: 'Mistborn',
    language: 'en',
    md5: generateMd5Hash('Mistborn: The Final Empire'),
  },
  {
    id: 2,
    title: 'The Name of the Wind',
    authors: 'Patrick Rothfuss',
    series: 'The Kingkiller Chronicle',
    language: 'en',
    md5: generateMd5Hash('The Name of the Wind'),
  },
  {
    id: 3,
    title: 'A Game of Thrones',
    authors: 'George R. R. Martin',
    series: 'A Song of Ice and Fire',
    language: 'en',
    md5: generateMd5Hash('A Game of Thrones'),
  },
  {
    id: 4,
    title: 'The Way of Kings',
    authors: 'Brandon Sanderson',
    series: 'The Stormlight Archive',
    language: 'en',
    md5: generateMd5Hash('The Way of Kings'),
  },
  {
    id: 5,
    title: 'The Fellowship of the Ring',
    authors: 'J.R.R. Tolkien',
    series: 'The Lord of the Rings',
    language: 'en',
    md5: generateMd5Hash('The Fellowship of the Ring'),
  },
  {
    id: 6,
    title: 'The Two Towers',
    authors: 'J.R.R. Tolkien',
    series: 'The Lord of the Rings',
    language: 'en',
    md5: generateMd5Hash('The Two Towers'),
  },
  {
    id: 7,
    title: 'The Last Wish',
    authors: 'Andrzej Sapkowski',
    series: 'The Witcher',
    language: 'en',
    md5: generateMd5Hash('The Last Wish'),
  },
  {
    id: 8,
    title: 'Hyperion',
    authors: 'Dan Simmons',
    series: 'Hyperion Cantos',
    language: 'en',
    md5: generateMd5Hash('Hyperion'),
  },
  {
    id: 9,
    title: 'The Martian',
    authors: 'Andy Weir',
    series: 'N/A',
    language: 'en',
    md5: generateMd5Hash('The Martian'),
  },
  {
    id: 10,
    title: 'Foundation',
    authors: 'Isaac Asimov',
    series: 'Foundation Series',
    language: 'en',
    md5: generateMd5Hash('Foundation'),
  },
];

export let SEEDED_BOOKS: Book[] = [];

export async function seed(knex: Knex): Promise<void> {
  await knex('book').del();

  const books = await Promise.all(SEED_BOOKS.map((book) => createBook(db, book)));
  SEEDED_BOOKS = books as Book[];
  console.log(`✓ Seeded ${SEEDED_BOOKS.length} books`);
}
