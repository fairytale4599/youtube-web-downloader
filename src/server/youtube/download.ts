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

  let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
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

  const fileId = randomUUID();
  const outputTemplate = path.join(TMP_DIR, `${fileId}.%(ext)s`);

  try {
    console.log('Fetching metadata and starting 1080p download via ytdlp-nodejs...');
    
    await ytdlp
      .download(videoUrl)
      .output(outputTemplate) 
      .filter('mergevideo')
      .quality('1080p')
      .type('mp4')
      .on('progress', (p) => console.log(`Download progress: ${p.percentage_str}`))
      .run();

    const files = fs.readdirSync(TMP_DIR);
    const targetFile = files.find(f => f.startsWith(fileId));

    if (!targetFile) throw new Error('Downloaded file not found.');

    const fullFilePath = path.join(TMP_DIR, targetFile);

    res.download(fullFilePath, 'video.mp4', (err) => {
      if (err) console.error('Error sending file:', err);
      
      fs.unlink(fullFilePath, (uErr) => {
        if (uErr) console.error('Error deleting file:', uErr);
        else console.log(`Temporary file ${targetFile} successfully deleted.`);
      });
    });

  } catch (error) {
    console.error('An error occurred during the download:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
