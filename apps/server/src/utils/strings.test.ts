import { generateMd5Hash } from './strings';

describe(generateMd5Hash, () => {
  it('generates the same hash for the same string', () => {
    const title = 'test';
    const hash1 = generateMd5Hash(title);
    const hash2 = generateMd5Hash(title);
    expect(hash1).toEqual(hash2);
  });

  it('generates different hashes for different strings', () => {
    const title1 = 'test1';
    const title2 = 'test2';
    const hash1 = generateMd5Hash(title1);
    const hash2 = generateMd5Hash(title2);
    expect(hash1).not.toEqual(hash2);
  });
});
