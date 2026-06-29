import { Progress, User } from '@koinsight/common/types';
import { Knex } from 'knex';
import { db } from '../../knex';
import { createUser } from '../factories/user-factory';
import { createProgress } from '../factories/progress-factory';
import { SEEDED_BOOKS } from './02_books';
import { SEEDED_DEVICES } from './01_devices';

/**
 * Create test users with the KoSync protocol
 * Password for all test users is: password123
 */
const TEST_USERS = [
  { username: 'reader1', password: 'password123' },
  { username: 'reader2', password: 'password123' },
  { username: 'bookworm', password: 'password123' },
];

export let SEEDED_USERS: User[] = [];
export let SEEDED_PROGRESS: Progress[] = [];

export async function seed(knex: Knex): Promise<void> {
  await knex('progress').del();
  await knex('user').del();

  // Create test users
  const users = await Promise.all(
    TEST_USERS.map((userData) => createUser(db, userData))
  );

  SEEDED_USERS = users;

  // Create progress records for each user
  const progressPromises: Promise<Progress>[] = [];

  SEEDED_USERS.forEach((user) => {
    // Each user has progress for 3-7 random books
    const numBooks = Math.floor(Math.random() * 5) + 3;
    const userBooks = [...SEEDED_BOOKS]
      .sort(() => Math.random() - 0.5)
      .slice(0, numBooks);

    userBooks.forEach((book) => {
      // Use a random device for each book
      const device = SEEDED_DEVICES[Math.floor(Math.random() * SEEDED_DEVICES.length)];

      // Create a realistic document name (similar to what KoReader uses)
      const documentName = `${book.title.replace(/\s+/g, '_')}.epub`;

      // Random reading progress (0-100%)
      const percentage = Math.random() * 100;

      progressPromises.push(
        createProgress(db, user, device, documentName, {
          percentage,
          progress: JSON.stringify({
            page: Math.floor((book.reference_pages ?? 300) * (percentage / 100)),
            position: percentage / 100,
          }),
        })
      );
    });
  });

  SEEDED_PROGRESS = await Promise.all(progressPromises);

  console.log(`✓ Seeded ${SEEDED_USERS.length} users with ${SEEDED_PROGRESS.length} progress records`);
  console.log('  Test user credentials:');
  TEST_USERS.forEach((user) => {
    console.log(`    - Username: ${user.username}, Password: ${user.password}`);
  });
}
