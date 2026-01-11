import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('annotation', (table) => {
    table.index('book_md5', 'idx_annotation_book');
    table.index('device_id', 'idx_annotation_device');
    table.index('annotation_type', 'idx_annotation_type');
    table.index('datetime', 'idx_annotation_datetime');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('annotation', (table) => {
    table.dropIndex('book_md5', 'idx_annotation_book');
    table.dropIndex('device_id', 'idx_annotation_device');
    table.dropIndex('annotation_type', 'idx_annotation_type');
    table.dropIndex('datetime', 'idx_annotation_datetime');
  });
}
