import express from 'express';
import request from 'supertest';
import { createDevice } from '../db/factories/device-factory';
import { db } from '../knex';
import { devicesRouter } from './devices-router';

describe('GET /devices', () => {
  const app = express();
  app.use(express.json());
  app.use('/devices', devicesRouter);

  it('returns all devices as JSON', async () => {
    await createDevice(db, { model: 'Device 1' });

    let response = await request(app).get('/devices');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toEqual(expect.objectContaining({ model: 'Device 1' }));

    await createDevice(db, { model: 'Device 2' });

    response = await request(app).get('/devices');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[1]).toEqual(expect.objectContaining({ model: 'Device 2' }));
  });
});
