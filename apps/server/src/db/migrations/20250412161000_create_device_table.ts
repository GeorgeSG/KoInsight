import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('device', (table) => {
    table.string('id').primary();
    table.string('model');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('device');
}
