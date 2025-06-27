import { Router } from 'express';
import { unlinkSync } from 'fs';
import multer from 'multer';
import { appConfig } from '../config';
import { UploadService } from './upload-service';

const storage = multer.diskStorage({
  destination: (_req, _res, cb) => {
    cb(null, appConfig.dataPath);
  },
  filename: (_req, _res, cb) => {
    cb(null, appConfig.upload.filename);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/octet-stream' || file.originalname.endsWith('.sqlite3')) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Only .sqlite3 files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.post('/', upload.single('file'), async (req, res, next) => {
  const uploadedFilePath = req.file?.path;

  if (!uploadedFilePath) {
    res.status(400).json({ error: 'No file uploaded' });
    next();
    return;
  }

  let db;
  try {
    db = UploadService.openStatisticsDbFile(uploadedFilePath);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid SQLite file or no books found' });
    return;
  }

  try {
    const { newBooks, newPageStats } = UploadService.extractDataFromStatisticsDb(db);
    await UploadService.uploadStatisticData(newBooks, newPageStats);

    res.json({ message: 'Database imported successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to import database' });
  } finally {
    db.close();
    unlinkSync(uploadedFilePath);
  }
});

export { router as uploadRouter };
