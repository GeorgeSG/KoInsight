import bcrypt from 'bcryptjs';
import { db } from '../knex';
import { User } from '@koinsight/common/types/user';

const SALT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return await bcrypt.hash(plain, SALT_ROUNDS);
}

export class UserExistsError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'UserExistsError';
  }
}

export class UserRepository {
  static async login(username: string, password: string): Promise<User | null> {
    const user = await db('User').where({ username }).first();
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  static async createUser(username: string, password: string): Promise<void> {
    const existingUser = await db('User').where({ username }).first();

    if (existingUser) {
      throw new UserExistsError();
    }

    const passwordHash = await hashPassword(password);
    await db('User').insert({ username, password_hash: passwordHash });
  }
}
