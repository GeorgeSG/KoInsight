import { User } from '@koinsight/common/types';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { Knex } from 'knex';

const SALT_ROUNDS = 12;

type FakeUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;

export async function fakeUser(overrides: Partial<FakeUser & { password: string }> = {}): Promise<FakeUser> {
  const password = overrides.password || 'password123';
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user: FakeUser = {
    username: overrides.username || faker.internet.username(),
    password_hash,
  };

  return user;
}

export async function createUser(
  db: Knex,
  overrides: Partial<FakeUser & { password: string }> = {}
): Promise<User> {
  const userData = await fakeUser(overrides);
  const [user] = await db<User>('user').insert(userData).returning('*');

  return user;
}
