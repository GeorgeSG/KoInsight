import { faker } from '@faker-js/faker';
import { Device } from '@koinsight/common/types';
import { Knex } from 'knex';

export function fakeDevice(overrides: Partial<Device> = {}): Device {
  const device: Device = {
    id: faker.string.uuid(),
    model: faker.helpers.arrayElement(['Kindle', 'Kobo', 'Nook', 'Note Air 3C']),
    ...overrides,
  };

  return device;
}

export async function createDevice(db: Knex, overrides: Partial<Device> = {}): Promise<Device> {
  const deviceData = fakeDevice(overrides);
  const [device] = await db<Device>('device').insert(deviceData).returning('*');

  return device;
}
