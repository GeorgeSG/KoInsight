import { GetAllStatsResponse } from '@koinsight/common/types';
import { Request, Response, Router } from 'express';
import { PageStatRepository } from '../stats/page-stat-repository';
import { StatsService } from './stats-service';

const router = Router();

/**
 * Get all stats
 */
router.get('/', async (_: Request, res: Response) => {
  const stats = await PageStatRepository.getAll();
  const perMonth = StatsService.getPerMonthReadingTime(stats);

  const response: GetAllStatsResponse = { stats, perMonth };

  res.json(response);
});

/**
 * Get stats by book md5
 */
router.get('/:book_md5', async (req: Request, res: Response) => {
  const book = await PageStatRepository.getByBookMD5(req.params.book_md5);
  res.json(book);
});

export { router as statsRouter };
