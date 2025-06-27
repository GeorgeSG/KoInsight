import { Book } from '@koinsight/common/types';
import { existsSync, mkdirSync, promises, rename, rmSync } from 'fs';
import path from 'path';
import { appConfig } from '../../config';

export class CoversService {
  static async get(book: Book): Promise<string | null> {
    const files = await promises.readdir(appConfig.coversPath);
    const file = files.find((f) => f.startsWith(book.md5));

    if (file) {
      return `${appConfig.coversPath}/${file}`;
    } else {
      return null;
    }
  }

  static async deleteExisting(book: Book) {
    const files = await promises.readdir(appConfig.coversPath);
    const file = files.find((f) => f.startsWith(book.md5));

    if (file) {
      const filePath = `${appConfig.coversPath}/${file}`;
      rmSync(filePath, { force: true });
    }
  }

  static async upload(book: Book, file: Express.Multer.File) {
    if (!existsSync(appConfig.coversPath)) {
      mkdirSync(appConfig.coversPath, { recursive: true });
    }

    const extension = path.extname(file.originalname) || '';
    const newFilename = `${book.md5}${extension}`;
    const newPath = path.join(path.dirname(file.path), newFilename);
    await rename(file.path, newPath, () => {});
  }
}
