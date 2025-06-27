import express from 'express';
import request from 'supertest';
import { createDevice } from '../db/factories/device-factory';
import { db } from '../knex';
import { statsRouter } from './stats-router';
import { createBook } from '../db/factories/book-factory';
import { createBookDevice } from '../db/factories/book-device-factory';
import { createPageStat } from '../db/factories/page-stat-factory';
import { Book, BookDevice, Device } from '@koinsight/common/types';

describe('GET /stats', () => {
  const app = express();
  app.use(express.json());
  app.use('/stats', statsRouter);

  let device: Device;
  let book: Book;
  let bookDevice: BookDevice;

  beforeEach(async () => {
    device = await createDevice(db, { model: 'Device 1' });
    book = await createBook(db, { reference_pages: 100 });
    bookDevice = await createBookDevice(db, book, device, { pages: 100 });
  });

  it('returns all stats', async () => {
    await createPageStat(db, book, bookDevice, device, { duration: 10, page: 1 });
    await createPageStat(db, book, bookDevice, device, { duration: 20, page: 2 });
    await createPageStat(db, book, bookDevice, device, { duration: 10, page: 3 });
    await createPageStat(db, book, bookDevice, device, { duration: 20, page: 4 });

    const response = await request(app).get('/stats');
    const body = response.body;

    expect(response.status).toBe(200);

    // TODO: Do we need a more detailed test here provided everything is from the StatsService?
    expect(body).toHaveProperty('perMonth');
    expect(body.longestDay).toBe(20);
    expect(body.totalPagesRead).toBe(4);
  });
});
