import { faker } from '@faker-js/faker';
import { Book, BookDevice, Device, PageStat } from '@koinsight/common/types';
import { Knex } from 'knex';

export function fakePageStat(
  book: Book,
  bookDevice: BookDevice,
  device: Device,
  overrides: Partial<PageStat> = {}
): PageStat {
  const pageStat: PageStat = {
    device_id: device.id,
    book_md5: book.md5,
    page: faker.number.int({ min: 1, max: bookDevice.pages }),
    start_time: faker.date.past().getTime(),
    duration: faker.number.int({ min: 5, max: 120 }),
    total_pages: bookDevice.pages,
    ...overrides,
  };

  return pageStat;
}

export async function createPageStat(
  db: Knex,
  book: Book,
  bookDevice: BookDevice,
  device: Device,
  overrides: Partial<PageStat> = {}
): Promise<PageStat> {
  const pageStatData = fakePageStat(book, bookDevice, device, overrides);
  const [pageStat] = await db<PageStat>('page_stat').insert(pageStatData).returning('*');

  return pageStat;
}
