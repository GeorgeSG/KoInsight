import { GetAllStatsResponse } from '@koinsight/common/types';
import { Request, Response, Router } from 'express';
import { BooksRepository } from '../books/books-repository';
import { StatsRepository } from './stats-repository';
import { StatsService } from './stats-service';

const router = Router();

/**
 * Get all stats
 */
router.get('/', async (_: Request, res: Response) => {
  const books = await BooksRepository.getAllWithData();
  const totalPagesRead = StatsService.totalPagesRead(books);

  const stats = await StatsRepository.getAll();
  const perMonth = StatsService.getPerMonthReadingTime(stats);
  const perDayOfTheWeek = StatsService.perDayOfTheWeek(stats);
  const mostPagesInADay = StatsService.mostPagesInADay(books, stats);
  const totalReadingTime = StatsService.totalReadingTime(stats);
  const longestDay = StatsService.longestDay(stats);
  const last7DaysReadTime = StatsService.last7DaysReadTime(stats);

  const response: GetAllStatsResponse = {
    stats,
    perMonth,
    perDayOfTheWeek,
    mostPagesInADay,
    totalReadingTime,
    longestDay,
    last7DaysReadTime,
    totalPagesRead,
  };

  res.status(200).json(response);
});

/**
 * Get stats by book md5
 */
router.get('/:book_md5', async (req: Request, res: Response) => {
  const book = await StatsRepository.getByBookMD5(String(req.params.book_md5));
  res.status(200).json(book);
});

export { router as statsRouter };
