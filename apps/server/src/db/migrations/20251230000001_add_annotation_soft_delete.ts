import type { Knex } from 'knex';

/**
 * Add soft-delete support to annotations table
 * - Adds deleted_at column for tracking when annotations were soft-deleted
 * - Creates partial index for efficient queries (only indexes non-NULL deleted_at values)
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('annotation', (table) => {
    table.timestamp('deleted_at').nullable();
  });

  // Create partial index for deleted annotations (more efficient than full index)
  await knex.raw(`
    CREATE INDEX idx_annotation_deleted_at 
    ON annotation(deleted_at) 
    WHERE deleted_at IS NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_annotation_deleted_at');
  
  await knex.schema.alterTable('annotation', (table) => {
    table.dropColumn('deleted_at');
  });
}
