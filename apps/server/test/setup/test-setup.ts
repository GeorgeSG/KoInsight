import { db } from '../../src/knex';

beforeAll(async () => {
  await db.migrate.latest();
});

beforeEach(async () => {
  await db.raw('PRAGMA foreign_keys = OFF');

  const tables = ['annotation', 'book', 'book_device', 'book_genre', 'device', 'genre', 'page_stat', 'user'];

  for (const table of tables) {
    await db(table).truncate();
  }

  await db.raw('PRAGMA foreign_keys = ON');
});

afterAll(async () => {
  await db.destroy();
});
