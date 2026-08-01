import { KoReaderAnnotation } from '@koinsight/common/types/annotation';
import { KoReaderBook } from '@koinsight/common/types/book';
import { Device } from '@koinsight/common/types/device';
import { PageStat } from '@koinsight/common/types/page-stat';
import archiver from 'archiver';
import { NextFunction, Request, Response, Router } from 'express';
import { existsSync, mkdirSync, unlink } from 'fs';
import multer from 'multer';
import path from 'path';
import { BooksRepository } from '../books/books-repository';
import { CoversService } from '../books/covers/covers-service';
import { appConfig } from '../config';
import { DeviceRepository } from '../devices/device-repository';
import { UploadService } from '../upload/upload-service';

// Router for KoInsight koreader plugin
const router = Router();

export const REQUIRED_PLUGIN_VERSION = '0.3.1';

const rejectOldPluginVersion = (req: Request, res: Response, next: NextFunction) => {
  const { version } = req.body;

  if (!version || version !== REQUIRED_PLUGIN_VERSION) {
    res.status(400).json({
      error: `Unsupported plugin version. Version must be ${REQUIRED_PLUGIN_VERSION}. Please update your KOReader koinsight.koplugin`,
    });
    return;
  }

  next();
};

const pluginCoverUpload = multer({
  dest: appConfig.coversPath,
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    if (
      file.mimetype === 'application/octet-stream' ||
      allowedExtensions.some((ext) => file.originalname.toLowerCase().endsWith(ext))
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedExtensions.join(', ')} files are allowed`));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'version', maxCount: 1 },
]);

router.post('/device', rejectOldPluginVersion, async (req, res) => {
  const { id, model } = req.body;

  if (!id || !model) {
    res.status(400).json({ error: 'Missing device ID or model' });
    return;
  }

  const device: Device = { id, model };

  try {
    console.debug('Registering device:', device);
    await DeviceRepository.insertIfNotExists(device);
    res.status(200).json({ message: 'Device registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registering device' });
  }
});

router.post('/import', rejectOldPluginVersion, async (req, res) => {
  const contentLength = req.headers['content-length'];
  console.warn(`[${req.method}] ${req.url} — Content-Length: ${contentLength || 'unknown'} bytes`);

  const koreaderBooks: KoReaderBook[] = req.body.books;
  const newPageStats: PageStat[] = req.body.stats;
  const annotations: Record<string, KoReaderAnnotation[]> = req.body.annotations || {};
  const deviceId: string | undefined = req.body.device_id; // For annotation sync path

  try {
    console.debug('Importing books:', koreaderBooks);
    console.debug('Importing page stats:', newPageStats);
    console.debug(
      'Importing annotations:',
      Object.keys(annotations).length,
      'books with annotations'
    );

    await UploadService.uploadStatisticData(koreaderBooks, newPageStats, annotations, deviceId);

    const bookList = Array.isArray(koreaderBooks) ? koreaderBooks : [];
    const importedMd5s = bookList.map((b) => b.md5).filter(Boolean) as string[];
    const missing_cover_md5 = await CoversService.filterMd5WithoutCover(importedMd5s);

    res.status(200).json({
      message: 'Upload successful',
      missing_cover_md5,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error importing data' });
  }
});

router.post('/books/:md5/cover', (req, res, next) => {
  if (!existsSync(appConfig.coversPath)) {
    mkdirSync(appConfig.coversPath, { recursive: true });
  }
  next();
}, (req, res, next) => {
  pluginCoverUpload(req, res, (err) => {
    if (err) {
      console.error('Cover upload parse error:', err);
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid upload' });
      return;
    }
    next();
  });
}, async (req: Request, res: Response) => {
  const files = req.files as { file?: Express.Multer.File[] };
  const file = files?.file?.[0];
  const version = req.body?.version;

  const cleanupTemp = () => {
    if (file?.path) {
      try {
        unlink(file.path, () => {});
      } catch {
        // ignore
      }
    }
  };

  if (!version || version !== REQUIRED_PLUGIN_VERSION) {
    cleanupTemp();
    res.status(400).json({
      error: `Unsupported plugin version. Version must be ${REQUIRED_PLUGIN_VERSION}. Please update your KOReader koinsight.koplugin`,
    });
    return;
  }

  if (!file) {
    res.status(400).json({ error: 'Missing file upload' });
    return;
  }

  const md5 = req.params.md5;
  try {
    const book = await BooksRepository.getByMd5(md5);
    if (!book) {
      cleanupTemp();
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    await CoversService.deleteExisting(book);
    await CoversService.upload(book, file);
    res.status(200).json({ message: 'Cover updated' });
  } catch (e) {
    cleanupTemp();
    console.error('Error uploading plugin cover:', e);
    res.status(500).json({ error: 'Unable to update cover' });
  }
});

// TODO: implement check in koreader plugin
router.get('/health', rejectOldPluginVersion, async (_, res) => {
  res.status(200).json({ message: 'Plugin is healthy' });
});

router.get('/download', (_, res) => {
  const folderPath = path.join(__dirname, '../../../../', 'plugins');
  const archive = archiver('zip', { zlib: { level: 9 } });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=koinsight.plugin.zip');

  archive.on('error', (err) => {
    console.error('Archive error:', err);
    res.status(500).send('Error creating zip');
  });

  // Pipe the archive directly to the response
  archive.pipe(res);

  // Add folder contents to the archive
  archive.directory(folderPath, false);

  archive.finalize();
});

export { router as kopluginRouter };
