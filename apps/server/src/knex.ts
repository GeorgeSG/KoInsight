import knex, { Knex } from 'knex';
import config from './knexfile';

const environment = process.env.NODE_ENV || 'development';
export const db: Knex = knex(config[environment]);
