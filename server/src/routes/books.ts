import { startOfDay } from 'date-fns/startOfDay';
import { NextFunction, Request, Response, Router } from 'express';
import { COVERS_PATH } from '../const';
import { BookRepository } from '../db/book-repository';
import { PageStatRepository } from '../db/page-stat-repository';

const router = Router();

router.get('/books', async (_: Request, res: Response) => {
  const books = await BookRepository.getAll();
  res.json(books);
});

router.get('/books/:id', async (req: Request, res: Response, next: NextFunction) => {
  const book = await BookRepository.getById(Number(req.params.id));

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    next();
    return;
  }

  const stats = await PageStatRepository.getByBookId(Number(req.params.id));

  const started_reading = stats.reduce((acc, stat) => Math.min(acc, stat.start_time), Infinity);

  const read_per_day = stats.reduce((acc, stat) => {
    const day = startOfDay(stat.start_time * 1000).getTime();
    acc[day] = (acc[day] || 0) + stat.duration;

    return acc;
  }, {} as Record<string, number>);

  res.json({ ...book, stats, started_reading, read_per_day });
});

router.delete('/books/:id', async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    await BookRepository.softDelete(Number(id));
    res.status(200).json({ status: 'Book deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

router.get('/books/:id/cover', (req: Request, res: Response) => {
  res.sendFile(`${COVERS_PATH}/${req.params.id}.jpg`, (err) => {
    if (err) {
      res.status(404).send('Cover not found');
    }
  });
});

export { router as booksRouter };
