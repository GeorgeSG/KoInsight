import { faker } from '@faker-js/faker';
import { Book, BookDevice, Device } from '@koinsight/common/types';
import { Knex } from 'knex';

type FakeBookDevice = Omit<BookDevice, 'id'>;

export function fakeBookDevice(
  book: Book,
  device: Device,
  overrides: Partial<FakeBookDevice> = {}
): FakeBookDevice {
  const bookDevice: FakeBookDevice = {
    book_md5: book.md5,
    device_id: device.id,
    last_open: faker.date.past().getTime() / 1000,
    notes: faker.number.int({ min: 0, max: 100 }),
    highlights: faker.number.int({ min: 0, max: 100 }),
    pages: faker.number.int({ min: 0, max: 1000 }),
    total_read_time: faker.number.int({ min: 0, max: 100 }),
    total_read_pages: faker.number.int({ min: 0, max: 100 }),
    ...overrides,
  };

  return bookDevice;
}

export async function createBookDevice(
  db: Knex,
  book: Book,
  device: Device,
  overrides: Partial<FakeBookDevice> = {}
): Promise<BookDevice> {
  const bookDeviceData = fakeBookDevice(book, device, overrides);
  const [bookDevice] = await db<BookDevice>('book_device').insert(bookDeviceData).returning('*');

  return bookDevice;
}
