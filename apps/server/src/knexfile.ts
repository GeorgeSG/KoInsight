import { Knex } from 'knex';
import { appConfig } from './config';

const defaultConfig: Knex.Config = {
  useNullAsDefault: true,
  client: 'better-sqlite3',
};

const config: { [key: string]: Knex.Config } = {
  development: {
    ...defaultConfig,
    connection: { filename: appConfig.db.dev },
    seeds: { directory: './db/seeds' },
    migrations: { directory: './db/migrations' },
  },
  production: {
    ...defaultConfig,
    connection: { filename: appConfig.db.prod },
    migrations: { directory: './db/migrations' },
  },
  test: {
    ...defaultConfig,
    connection: { filename: ':memory:' },
    migrations: {
      directory: './test/dist/migrations',
    },
  },
};

export default config;
