import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('annotation', (table) => {
    table.integer('total_pages').nullable().comment('Total pages in document at time of annotation creation');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('annotation', (table) => {
    table.dropColumn('total_pages');
  });
}
