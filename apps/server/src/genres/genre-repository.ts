import { Genre } from '@koinsight/common/types/genre';
import { db } from '../knex';

type GenreCreate = Omit<Genre, 'id'>;

export class GenreRepository {
  static async getAll(): Promise<Genre[]> {
    return db<Genre>('genre').select('*');
  }

  static async getByName(name: string): Promise<Genre | undefined> {
    return db<Genre>('genre').where({ name }).first();
  }

  static async getByBookMd5(md5: string): Promise<Genre[]> {
    return db<Genre>('genre')
      .select('genre.name')
      .join('book_genre', 'book_genre.id', 'genre.id')
      .where({ 'book_genre.book_md5': md5 });
  }

  static async create(genre: GenreCreate): Promise<Genre> {
    const [createdGenre] = await db<Genre>('genre').insert(genre).returning('*');

    return createdGenre;
  }

  static async findOrCreate(genre: GenreCreate): Promise<Genre> {
    const existingGenre = await this.getByName(genre.name);

    if (existingGenre) {
      return existingGenre;
    } else {
      return this.create(genre);
    }
  }
}
