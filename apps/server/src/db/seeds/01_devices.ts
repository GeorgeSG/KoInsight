import { Device } from '@koinsight/common/types/device';
import { Knex } from 'knex';
import { db } from '../../knex';
import { createDevice, fakeDevice } from '../factories/device-factory';

function generateDevices(): Device[] {
  const deviceNames = ['Kindle', 'Kobo', 'Nook', 'iPad', 'Android Tablet'];
  return deviceNames.map((name) => fakeDevice({ model: name }));
}

const SEED_DEVICES = generateDevices();

export let SEEDED_DEVICES: Device[] = [];

export async function seed(knex: Knex): Promise<void> {
  await knex('book_device').del();
  await knex('book').del();
  await knex('device').del();

  const devices = await Promise.all(SEED_DEVICES.map((device) => createDevice(db, device)));

  SEEDED_DEVICES = devices as Device[];
  console.log(`✓ Seeded ${SEEDED_DEVICES.length} devices`);
}
