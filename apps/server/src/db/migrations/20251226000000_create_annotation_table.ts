import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('annotation', (table) => {
    table.increments('id').primary();
    table.string('book_md5', 32).notNullable();
    table.string('device_id').notNullable();

    // Type detection (derived from fields)
    table.string('annotation_type', 20).notNullable(); // 'highlight', 'note', 'bookmark'

    // Content
    table.text('text'); // highlighted text (NULL for bookmarks)
    table.text('note'); // user note/annotation

    // Styling (NULL for bookmarks)
    table.string('drawer', 50); // 'lighten', 'underscore', 'invert'
    table.string('color', 50); // 'yellow', 'red', 'blue', 'green'

    // Location
    table.text('chapter');
    table.integer('pageno'); // continuous page number
    table.text('page_ref'); // PDF: number string, EPUB: xPointer

    // Position data (NULL for bookmarks, JSON for flexibility)
    table.text('pos0'); // JSON: {x, y, page} for PDF
    table.text('pos1'); // JSON: {x, y, page} for PDF

    // Timestamps from KoReader
    table.string('datetime').notNullable(); // creation timestamp from KoReader
    table.string('datetime_updated'); // last modification from KoReader

    // Metadata
    table.timestamps(true, true); // created_at, updated_at

    // Foreign keys
    table.foreign('book_md5').references('book.md5').onDelete('CASCADE');
    table.foreign('device_id').references('device.id').onDelete('CASCADE');

    // Prevent duplicates (same position + time = same annotation)
    table.unique(['book_md5', 'device_id', 'page_ref', 'datetime']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('annotation');
}
