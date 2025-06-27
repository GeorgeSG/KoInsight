import { Book } from '@koinsight/common/types/book';
import { NextFunction, Request, Response } from 'express';
import { BooksRepository } from './books-repository';

declare global {
  namespace Express {
    interface Request {
      book?: Book;
    }
  }
}

export async function getBookById(req: Request, res: Response, next: NextFunction) {
  const bookId = req.params.bookId;

  if (!bookId) {
    res.status(400).json({ error: 'Book ID is required' });
    return;
  }

  try {
    const book = await BooksRepository.getById(Number(bookId));

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    req.book = book;
    next();
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}
