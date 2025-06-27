import { NextFunction, Request, Response, Router } from 'express';
import { getBookInsights } from './open-ai-service';

const router = Router();

router.get('/book-insights', async (req: Request, res: Response, next: NextFunction) => {
  const { title, author } = req.query;

  try {
    const book_insights = await getBookInsights(title?.toString() ?? '', author?.toString() ?? '');
    res.send(book_insights);
  } catch {
    res.status(500).send('Failed to fetch data');
  }
});

export { router as openAiRouter };
