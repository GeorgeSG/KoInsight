import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('book_device', (table) => {
    table.increments('id').primary();
    table.string('book_md5').references('book.md5');
    table.string('device_id').references('device.id');

    // Migrate from book table to per-device
    table.integer('last_open').defaultTo(0);
    table.integer('notes').defaultTo(0);
    table.integer('highlights').defaultTo(0);
    table.integer('pages').defaultTo(0);
    table.integer('total_read_time').defaultTo(0);
    table.integer('total_read_pages').defaultTo(0);

    table.unique(['book_md5', 'device_id']);
  });

  await knex.schema.alterTable('book', (table) => {
    table.dropColumn('last_open');
    table.dropColumn('notes');
    table.dropColumn('highlights');
    table.dropColumn('pages');
    table.dropColumn('total_read_time');
    table.dropColumn('total_read_pages');
  });
}

export async function down(knex: Knex): Promise<void> {
  throw new Error('Down migration impossible');
}
