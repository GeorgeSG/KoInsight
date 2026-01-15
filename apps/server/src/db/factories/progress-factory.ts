import { Progress, User, Device } from '@koinsight/common/types';
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';

type FakeProgress = Omit<Progress, 'id' | 'created_at' | 'updated_at'>;

export function fakeProgress(
  user: User,
  device: Device,
  documentName: string,
  overrides: Partial<FakeProgress> = {}
): FakeProgress {
  const percentage = faker.number.float({ min: 0, max: 100, fractionDigits: 2 });

  const progress: FakeProgress = {
    user_id: user.id!,
    document: documentName,
    progress: JSON.stringify({
      page: faker.number.int({ min: 1, max: 500 }),
      position: faker.number.float({ min: 0, max: 1, fractionDigits: 4 }),
    }),
    percentage,
    device: device.model,
    device_id: device.id,
    ...overrides,
  };

  return progress;
}

export async function createProgress(
  db: Knex,
  user: User,
  device: Device,
  documentName: string,
  overrides: Partial<FakeProgress> = {}
): Promise<Progress> {
  const progressData = fakeProgress(user, device, documentName, overrides);
  const date = new Date();
  const [progress] = await db<Progress>('progress')
    .insert({ ...progressData, created_at: date, updated_at: date })
    .returning('*');

  return progress;
}
