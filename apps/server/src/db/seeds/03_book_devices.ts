import { BookDevice } from '@koinsight/common/types';
import { Knex } from 'knex';
import { db } from '../../knex';
import { createBookDevice } from '../factories/book-device-factory';
import { SEEDED_DEVICES } from './01_devices';
import { SEEDED_BOOKS } from './02_books';

export let SEEDED_BOOK_DEVICES: BookDevice[] = [];

export async function seed(knex: Knex): Promise<void> {
  await knex('book_device').del();

  let promises: Promise<BookDevice>[] = [];

  SEEDED_BOOKS.forEach((book) => {
    SEEDED_DEVICES.forEach((device) => {
      promises.push(createBookDevice(db, book, device));
    });
  });

  SEEDED_BOOK_DEVICES = await Promise.all(promises);
}
