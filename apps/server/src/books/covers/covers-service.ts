import { Book } from '@koinsight/common/types';
import { existsSync, mkdirSync, promises, rmSync } from 'fs';
import path from 'path';
import { appConfig } from '../../config';

export class CoversService {
  /** Subset of md5 values that have no cover file on disk (single directory read). */
  static async filterMd5WithoutCover(md5s: string[]): Promise<string[]> {
    if (md5s.length === 0) {
      return [];
    }
    let files: string[];
    try {
      files = await promises.readdir(appConfig.coversPath);
    } catch {
      return [...new Set(md5s)];
    }
    const unique = [...new Set(md5s)];
    return unique.filter((md5) => !files.some((f) => f.startsWith(md5)));
  }

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
    await promises.rename(file.path, newPath);
  }
}
