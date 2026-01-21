import express from 'express';
import request from 'supertest';
import { createDevice } from '../db/factories/device-factory';
import { fakeKoReaderAnnotation } from '../db/factories/koreader-annotation-factory';
import { db } from '../knex';
import { kopluginRouter } from './koplugin-router';

describe('koplugin-router', () => {
  const app = express();
  app.use(express.json());
  app.use('/koplugin', kopluginRouter);

  const PLUGIN_VERSION = '0.2.0';

  describe('POST /koplugin/device', () => {
    it('registers a device', async () => {
      const response = await request(app)
        .post('/koplugin/device')
        .send({ id: 'device-123', model: 'Kindle Paperwhite', version: PLUGIN_VERSION });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Device registered successfully' });

      const device = await db('device').where({ id: 'device-123' }).first();
      expect(device).toEqual(
        expect.objectContaining({
          id: 'device-123',
          model: 'Kindle Paperwhite',
        })
      );
    });

    it('returns 400 when device ID is missing', async () => {
      const response = await request(app)
        .post('/koplugin/device')
        .send({ model: 'Kindle', version: PLUGIN_VERSION });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing device ID or model' });
    });

    it('returns 400 when model is missing', async () => {
      const response = await request(app)
        .post('/koplugin/device')
        .send({ id: 'device-123', version: PLUGIN_VERSION });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing device ID or model' });
    });

    it('returns 400 when plugin version is incorrect', async () => {
      const response = await request(app)
        .post('/koplugin/device')
        .send({ id: 'device-123', model: 'Kindle', version: '0.1.0' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Unsupported plugin version');
    });

    it('returns 400 when plugin version is missing', async () => {
      const response = await request(app)
        .post('/koplugin/device')
        .send({ id: 'device-123', model: 'Kindle' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Unsupported plugin version');
    });
  });

  describe('POST /koplugin/import', () => {
    it('imports books and stats', async () => {
      const bookMd5 = 'abc123def456';
      const device = await createDevice(db);

      const response = await request(app)
        .post('/koplugin/import')
        .send({
          version: PLUGIN_VERSION,
          books: [
            {
              md5: bookMd5,
              title: 'Test Book',
              authors: 'Test Author',
              series: 'Test Series',
              language: 'en',
              pages: 100,
              total_read_time: 60,
              total_read_pages: 1,
            },
          ],
          stats: [
            {
              book_md5: bookMd5,
              device_id: device.id,
              start_time: 1000,
              duration: 60,
              page: 1,
              total_pages: 100,
            },
          ],
          annotations: {},
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Upload successful' });

      const book = await db('book').where({ md5: bookMd5 }).first();
      expect(book).toEqual(
        expect.objectContaining({
          md5: bookMd5,
          title: 'Test Book',
          authors: 'Test Author',
        })
      );

      const stat = await db('page_stat').where({ book_md5: bookMd5 }).first();
      expect(stat).toEqual(
        expect.objectContaining({
          book_md5: bookMd5,
          duration: 60,
          page: 1,
        })
      );
    });

    it('imports books with annotations', async () => {
      const bookMd5 = 'def789ghi012';
      const device = await createDevice(db);

      const response = await request(app)
        .post('/koplugin/import')
        .send({
          version: PLUGIN_VERSION,
          books: [
            {
              md5: bookMd5,
              title: 'Annotated Book',
              authors: 'Test Author',
              language: 'en',
              pages: 200,
              total_read_time: 120,
              total_read_pages: 50,
            },
          ],
          stats: [
            {
              book_md5: bookMd5,
              device_id: device.id,
              start_time: 2000,
              duration: 120,
              page: 10,
              total_pages: 200,
            },
          ],
          annotations: {
            [bookMd5]: [
              fakeKoReaderAnnotation({
                chapter: 'Chapter 1',
                page: 10,
                pageno: 10,
                datetime: '2024-01-15T10:30:00',
                text: 'This is a highlight',
                note: 'Important passage',
              }),
              fakeKoReaderAnnotation({
                chapter: 'Chapter 2',
                page: 25,
                pageno: 25,
                datetime: '2024-01-15T11:00:00',
                text: 'Another highlight',
              }),
            ],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Upload successful' });

      const book = await db('book').where({ md5: bookMd5 }).first();
      expect(book).toEqual(
        expect.objectContaining({
          md5: bookMd5,
          title: 'Annotated Book',
        })
      );

      const annotations = await db('annotation').where({ book_md5: bookMd5 });
      expect(annotations).toHaveLength(2);
      expect(annotations[0]).toEqual(
        expect.objectContaining({
          book_md5: bookMd5,
          device_id: device.id,
          page_ref: '10',
          text: 'This is a highlight',
          note: 'Important passage',
        })
      );
      expect(annotations[1]).toEqual(
        expect.objectContaining({
          page_ref: '25',
          text: 'Another highlight',
          note: null,
        })
      );
    });

    it('returns 400 when plugin version is incorrect', async () => {
      const response = await request(app)
        .post('/koplugin/import')
        .send({
          version: '0.1.0',
          books: [],
          stats: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Unsupported plugin version');
    });
  });

  describe('GET /koplugin/health', () => {
    it('returns health status', async () => {
      const response = await request(app)
        .get('/koplugin/health')
        .send({ version: PLUGIN_VERSION });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Plugin is healthy' });
    });

    it('returns 400 when plugin version is incorrect', async () => {
      const response = await request(app).get('/koplugin/health').send({ version: '0.1.0' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Unsupported plugin version');
    });
  });

  describe('GET /koplugin/download', () => {
    it('returns a zip file', async () => {
      const response = await request(app).get('/koplugin/download');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/zip');
      expect(response.headers['content-disposition']).toContain('koinsight.plugin.zip');
    });
  });
});
