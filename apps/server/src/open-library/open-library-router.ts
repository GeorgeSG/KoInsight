import { NextFunction, Request, Response, Router } from 'express';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { BooksRepository } from '../books/books-repository';
import { CoversService } from '../books/covers/covers-service';
import { appConfig } from '../config';
import { OpenLibraryService } from './open-library-service';

const router = Router();

router.get('/list-covers', async (req: Request, res: Response, next: NextFunction) => {
  const { searchTerm, limit } = req.query;

  OpenLibraryService.queryCovers(searchTerm as string, Number(limit))
    .then((covers) => {
      res.send(covers);
    })
    .catch((error) => {
      res.status(500).send('Error fetching covers');
      next(error);
    });
});

// TODO: change method?
/**
 * Fetches a book cover from Open Library API and saves it to the server
 */
router.get('/cover', async (req: Request, res: Response, next: NextFunction) => {
  const { coverId, bookId, size = 'M' } = req.query;

  if (!bookId || !coverId) {
    res.status(400).send('Invalid request');
    return next();
  }

  const book = await BooksRepository.getById(Number(bookId));
  if (!book) {
    res.status(404).send('Book not found');
    return next();
  }

  if (!existsSync(appConfig.coversPath)) {
    mkdirSync(appConfig.coversPath);
  }

  try {
    CoversService.deleteExisting(book);
    const cover = await OpenLibraryService.fetchCover(coverId as string, size as 'S' | 'M' | 'L');
    writeFileSync(`${appConfig.coversPath}/${book.md5}.jpg`, Buffer.from(cover));
    res.send({ status: 'Cover updated' });
  } catch {
    res.status(404).send('Cover not found');
  }
});

export { router as openLibraryRouter };
