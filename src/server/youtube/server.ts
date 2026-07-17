import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { YtDlp } from 'ytdlp-nodejs';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const app = express();
const PORT = 3000;

const ytdlp = new YtDlp();

app.use(cors());
app.use(express.json());

const TMP_DIR = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR);
}

app.post('/api/search', async (req: Request, res: Response): Promise<void> => {
  const { query, pageToken, apiKey } = req.body;

  if (!apiKey) {
    res.status(400).json({ error: 'API key is required.' });
    return;
  }

  let url = `https://googleapis.com{encodeURIComponent(query)}&type=video&key=${apiKey}`;
  if (pageToken) url += `&pageToken=${pageToken}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    
    const data = await response.json();
    res.json({
      items: data.items || [],
      nextPageToken: data.nextPageToken,
      prevPageToken: data.prevPageToken
    });
  } catch (error) {
    console.error('Error fetching data from YouTube API:', error);
    res.status(500).json({ error: 'Failed to fetch data from YouTube' });
  }
});

app.post('/api/download', async (req: Request, res: Response): Promise<void> => {
  const { videoUrl } = req.body;

  if (!videoUrl) {
    res.status(400).json({ error: 'YouTube URL is required.' });
    return;
  }

  const outputTemplate = path.join(TMP_DIR, '%(title)s.%(ext)s');

  function findFirstFile(dir: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile()) {
        return fullPath;
      }

      if (entry.isDirectory()) {
        const found = findFirstFile(fullPath);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  try {
    console.log('Starting download:', videoUrl);

    await ytdlp
      .download(videoUrl)
      .output(outputTemplate)
      .filter('mergevideo')
      .quality('1080p')
      .type('mp4')
      .on('progress', (p) => {
        console.log(`Progress: ${p.percentage_str}`);
      })
      .run();

    const fullFilePath = findFirstFile(TMP_DIR);

    if (!fullFilePath) {
      throw new Error('No downloaded file found.');
    }

    const targetFile = path.basename(fullFilePath);

    console.log('Found downloaded file:', fullFilePath);

    res.json({
      success: true,
      file: targetFile,
      path: fullFilePath,
    });

  } catch (error) {
    console.error('Download failed:', error);

    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));