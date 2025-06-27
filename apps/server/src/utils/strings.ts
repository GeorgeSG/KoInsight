export function generateMd5Hash(title: string): string {
  return require('crypto').createHash('md5').update(title).digest('hex');
}
