import { NextFunction, Request, Response } from 'express';
import { UserRepository } from './user-repository';
import { User } from '@koinsight/common/types/user';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const username = req.header('x-auth-user');
  const key = req.header('x-auth-key');

  if (!username || !key) {
    res.status(401).json({ error: 'Missing authentication headers' });
    return;
  }

  try {
    const user = await UserRepository.login(username, key);

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      req.user = user;
      next();
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
