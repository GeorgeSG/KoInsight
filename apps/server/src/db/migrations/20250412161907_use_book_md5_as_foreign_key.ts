import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Change md5 to VARCHAR(32) and ensure it is not nullable and unique
  // Covert other text fields in book to VARCHAR
  await knex.schema.alterTable('book', (table) => {
    table.string('md5', 32).notNullable().unique().alter();
    table.string('title').alter();
    table.string('authors').alter();
    table.string('series').alter();
    table.string('language').alter();
  });

  // Add device_id to page_stat
  await knex.schema.alterTable('page_stat', (table) => {
    table.string('device_id').references('device.id').onDelete('CASCADE');
  });

  // Add new book_md5 columns to referencing tables
  await knex.schema.alterTable('page_stat', (table) => {
    table.string('book_md5', 32);
    table.dropForeign('book_id');

    table.dropUnique(['book_id', 'page', 'start_time'], 'page_stat_book_id_page_start_time_unique');
    table.unique(['book_md5', 'device_id', 'page', 'start_time']);

    table.dropColumn('book_id');
    table.foreign('book_md5').references('book.md5').onDelete('CASCADE');
  });

  await knex.schema.alterTable('book_genre', (table) => {
    table.string('book_md5', 32);
    table.dropForeign('book_id');

    table.dropUnique(['book_id', 'genre_id'], 'book_genre_book_id_genre_id_unique');
    table.unique(['book_md5', 'genre_id']);

    table.dropColumn('book_id');
    table.foreign('book_md5').references('book.md5').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  throw new Error('Down migration impossible');
}
