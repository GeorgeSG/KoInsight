import { Request, Response, Router } from 'express';
import { DeviceRepository } from '../devices/device-repository';
const router = Router();

router.get('/', async (_: Request, res: Response) => {
  const devices = await DeviceRepository.getAll();
  res.status(200).json(devices);
});

export { router as devicesRouter };
