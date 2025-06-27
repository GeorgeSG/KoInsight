import { faker } from '@faker-js/faker';
import { Genre } from '@koinsight/common/types';
import { Knex } from 'knex';

type FakeGenre = Omit<Genre, 'id'>;

export function fakeGenre(overrides: Partial<FakeGenre> = {}): FakeGenre {
  const genre: FakeGenre = {
    name: faker.book.genre(),
    ...overrides,
  };

  return genre;
}

export async function createGenre(db: Knex, overrides: Partial<FakeGenre> = {}): Promise<Genre> {
  const genreData = fakeGenre(overrides);
  const [genre] = await db<Genre>('genre').insert(genreData).returning('*');
  return genre;
}
