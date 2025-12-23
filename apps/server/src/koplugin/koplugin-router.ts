import { KoReaderBook } from '@koinsight/common/types/book';
import { Device } from '@koinsight/common/types/device';
import { PageStat } from '@koinsight/common/types/page-stat';
import archiver from 'archiver';
import { NextFunction, Request, Response, Router } from 'express';
import path from 'path';
import { DeviceRepository } from '../devices/device-repository';
import { UploadService } from '../upload/upload-service';

// Router for KoInsight koreader plugin
const router = Router();

const REQUIRED_PLUGIN_VERSION = '0.2.0';

const rejectOldPluginVersion = (req: Request, res: Response, next: NextFunction) => {
  const { version } = req.body;

  if (!version || version !== '0.2.0') {
    res.status(400).json({
      error: `Unsupported plugin version. Version must be ${REQUIRED_PLUGIN_VERSION}. Please update your KOReader koinsight.koplugin`,
    });
    return;
  }

  next();
};

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

  try {
    console.debug('Importing books:', koreaderBooks);
    console.debug('Importing page stats:', newPageStats);
    await UploadService.uploadStatisticData(koreaderBooks, newPageStats);
    res.status(200).json({ message: 'Upload successfull' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error importing data' });
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
