import { Progress } from '@koinsight/common/types/progress';
import { Request, Response, Router } from 'express';
import { authenticate } from './kosync-authenticate-middleware';
import { KosyncRepository } from './kosync-repository';
import { UserExistsError, UserRepository } from './user-repository';

const router = Router();

/**
 *  KoSync API
 * "path" : "/users/create",
 * "method" : "POST",
 * "required_params" : [
 *     "username",
 *     "password",
 * ],
 * "payload" : [
 *     "username",
 *     "password",
 * ],
 * "expected_status" : [201, 402]
 */
router.post('/users/create', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  try {
    await UserRepository.createUser(username, password);
  } catch (error) {
    if (error instanceof UserExistsError) {
      res.status(402).json({ error: 'User already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
    console.error(error);
    return;
  }

  res.status(201).json({ message: 'User created successfully' });
});

router.get('/users/auth', async (req: Request, res: Response) => {
  const username = req.header('x-auth-user');
  const password = req.header('x-auth-key');

  if (!username || !password) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  let user = null;
  try {
    user = await UserRepository.login(username, password);
  } catch (error) {}

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
  } else {
    res.status(200).json({ authorized: 'OK' });
  }
});

/**
 * KoSync API
 *
 * "path" : "/syncs/progress",
 * "method" : "PUT",
 * "required_params" : [
 *     "document",
 *     "progress",
 *     "percentage",
 *     "device",
 *     "device_id",
 * ],
 * "payload" : [
 *     "document",
 *     "progress",
 *     "percentage",
 *     "device",
 *     "device_id",
 * ],
 * "expected_status" : [200, 202, 401]
 */
router.put('/syncs/progress', authenticate, async (req: Request, res: Response) => {
  const { document, progress, percentage, device, device_id } = req.body;

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!document || !progress || !percentage || !device || !device_id) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  let insertedProgress: Partial<Progress> | undefined;
  try {
    insertedProgress = await KosyncRepository.upsert(req.user.id, {
      document,
      progress,
      percentage,
      device,
      device_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }

  res.status(200).json(insertedProgress);
});

/**
 * KoSync API
 *
 * "path" : "/syncs/progress/:document",
 * "method" : "GET",
 * "required_params" : [
 *     "document",
 * ],
 * "expected_status" : [200, 401]
 */
router.get('/syncs/progress/:document', authenticate, async (req: Request, res: Response) => {
  const { document } = req.params;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!document) {
    res.status(400).json({ error: 'Document is required' });
    return;
  }

  const progress = await KosyncRepository.getByUserIdAndDocument(user.id, document);
  if (!progress) {
    res.status(404).json({ error: 'Progress not found' });
    return;
  }

  res.status(200).json(progress);
});

router.get('/syncs/progress', async (req: Request, res: Response) => {
  const progresses = await KosyncRepository.getAll();
  res.status(200).json(progresses);
});

export { router as kosyncRouter };
