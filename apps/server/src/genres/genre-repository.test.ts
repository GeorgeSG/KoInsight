import { createBook } from '../db/factories/book-factory';
import { createGenre } from '../db/factories/genre-factory';
import { db } from '../knex';
import { GenreRepository } from './genre-repository';

describe(GenreRepository, () => {
  describe(GenreRepository.getAll, () => {
    it('returns all genres', async () => {
      await createGenre(db, { name: 'Fantasy' });
      await createGenre(db, { name: 'Comedy' });
      const genres = await GenreRepository.getAll();
      expect(genres.length).toBe(2);
    });

    it('returns 0 with no genres', async () => {
      const genres = await GenreRepository.getAll();
      expect(genres.length).toBe(0);
    });
  });

  describe(GenreRepository.getByName, () => {
    it('returns a genre by name', async () => {
      const genre = await createGenre(db, { name: 'Fantasy' });
      const foundGenre = await GenreRepository.getByName(genre.name);
      expect(foundGenre?.name).toBe(genre.name);
    });

    it('returns undefined if genre not found', async () => {
      const foundGenre = await GenreRepository.getByName('Nonexistent');
      expect(foundGenre).toBeUndefined();
    });
  });

  describe(GenreRepository.getByBookMd5, () => {
    it('returns genres by book md5', async () => {
      const genre = await createGenre(db, { name: 'Fantasy' });
      await createBook(db, { md5: '12345' });
      await db('book_genre').insert({ genre_id: genre.id, book_md5: '12345' });
      const foundGenres = await GenreRepository.getByBookMd5('12345');
      expect(foundGenres.length).toBe(1);
      expect(foundGenres[0].name).toBe(genre.name);
    });

    it('returns empty array if no genres found', async () => {
      const foundGenres = await GenreRepository.getByBookMd5('Nonexistent');
      expect(foundGenres.length).toBe(0);
    });
  });

  describe(GenreRepository.create, () => {
    it('creates a genre', async () => {
      expect(await GenreRepository.getAll()).toEqual([]);

      const createdGenre = await GenreRepository.create({ name: 'Fantasy' });
      expect(createdGenre.name).toBe('Fantasy');
      expect(await GenreRepository.getAll()).toEqual([createdGenre]);
    });
  });

  describe(GenreRepository.findOrCreate, () => {
    it('returns existing genre if it exists', async () => {
      const genre = await createGenre(db, { name: 'Fantasy' });
      const foundGenre = await GenreRepository.findOrCreate({ name: genre.name });
      expect(foundGenre.name).toBe(genre.name);
      expect(await GenreRepository.getAll()).toHaveLength(1);
    });

    it('creates a new genre if it does not exist', async () => {
      expect(await GenreRepository.getAll()).toHaveLength(0);
      const foundGenre = await GenreRepository.findOrCreate({ name: 'Fantasy' });
      expect(foundGenre).toBeDefined();
      expect(foundGenre.name).toBe('Fantasy');
      expect(await GenreRepository.getAll()).toHaveLength(1);
    });
  });
});
