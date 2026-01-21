import { Genre } from '@koinsight/common/types';
import { Knex } from 'knex';
import { db } from '../../knex';
import { createGenre } from '../factories/genre-factory';
import { SEEDED_BOOKS } from './02_books';

// Define realistic genres for books
const GENRES = [
  'Fantasy',
  'Science Fiction',
  'Epic Fantasy',
  'Urban Fantasy',
  'Space Opera',
  'Hard Science Fiction',
  'Adventure',
  'Magic',
  'Military Fiction',
  'Post-Apocalyptic',
  'Time Travel',
  'Dystopian',
  'Cyberpunk',
  'Sword and Sorcery',
];

// Map books to their genres (by title pattern matching)
const BOOK_GENRE_MAPPING: { [key: string]: string[] } = {
  'Mistborn': ['Fantasy', 'Epic Fantasy', 'Magic', 'Adventure'],
  'The Name of the Wind': ['Fantasy', 'Adventure', 'Magic'],
  'A Game of Thrones': ['Fantasy', 'Epic Fantasy', 'Adventure', 'Military Fiction'],
  'The Way of Kings': ['Fantasy', 'Epic Fantasy', 'Adventure'],
  'The Fellowship of the Ring': ['Fantasy', 'Epic Fantasy', 'Adventure'],
  'The Two Towers': ['Fantasy', 'Epic Fantasy', 'Adventure'],
  'The Last Wish': ['Fantasy', 'Sword and Sorcery', 'Adventure'],
  'Hyperion': ['Science Fiction', 'Space Opera', 'Adventure'],
  'The Martian': ['Science Fiction', 'Hard Science Fiction', 'Adventure'],
  'Foundation': ['Science Fiction', 'Space Opera'],
};

export let SEEDED_GENRES: Genre[] = [];

export async function seed(knex: Knex): Promise<void> {
  await knex('book_genre').del();
  await knex('genre').del();

  // Create all unique genres
  const genres = await Promise.all(
    GENRES.map((name) => createGenre(db, { name }))
  );

  SEEDED_GENRES = genres;

  // Create book-genre associations
  const bookGenrePromises: Promise<any>[] = [];

  SEEDED_BOOKS.forEach((book) => {
    // Find matching genres for this book
    const bookGenres = Object.entries(BOOK_GENRE_MAPPING).find(([titlePattern]) =>
      book.title.includes(titlePattern)
    )?.[1] || [];

    // Associate book with its genres
    bookGenres.forEach((genreName) => {
      const genre = SEEDED_GENRES.find((g) => g.name === genreName);
      if (genre) {
        bookGenrePromises.push(
          db('book_genre').insert({
            book_md5: book.md5,
            genre_id: genre.id,
          })
        );
      }
    });
  });

  await Promise.all(bookGenrePromises);

  console.log(`✓ Seeded ${SEEDED_GENRES.length} genres with book associations`);
}
