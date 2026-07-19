import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { YtDlp } from 'ytdlp-nodejs';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;
const ytdlp = new YtDlp();

app.use(cors());
app.use(express.json());

const TMP_DIR = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

app.post('/api/search', async (req: Request, res: Response): Promise<void> => {
  const { query, pageToken, apiKey } = req.body;
  const baseUrl = 'https://www.googleapis.com/youtube/v3/search';
  let url = `${baseUrl}?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
  
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'YouTube API error');
    }
    
    const data = await response.json() as any;
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
  const { videoUrl, quality, format } = req.body;
  const fileName = `vid_${Date.now()}.${format || 'mp4'}`;
  const fullPath = path.join(TMP_DIR, fileName);

  try {
    await ytdlp
      .download(videoUrl)
      .format(format === 'mp3' ? 'bestaudio' : format)
      .output(fullPath)
      .run();

    /*res.download(fullPath, `download.${format || 'mp4'}`, (err) => {
      if (err) {
        console.error('Download transfer error:', err);
      } else {
        console.log('File successfully sent to user.');
      }
    });*/
  } catch (error) {
    console.error('Download process failed:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.post('/api/info', async (req: Request, res: Response): Promise<void> => {
  const { videoUrl } = req.body;
  
  try {
    const rawData = await ytdlp.getFormatsAsync(videoUrl);
    const formats = Array.isArray(rawData) ? rawData : (rawData as any).formats || [];

    if (!Array.isArray(formats) || formats.length === 0) {
      throw new Error("No formats found for this video");
    }

    const videoFormats = [...new Set(formats.map((f: any) => f.ext))];
    const videoQuality = [...new Set(
      formats
        .filter((f: any) => f.vcodec !== 'none' && f.height)
        .map((f: any) => `${f.height}p`)
    )].sort((a: any, b: any) => parseInt(b) - parseInt(a));

    res.json({ videoFormats, videoQuality });
  } catch (error: any) {
    console.error('FULL ERROR FROM YTDLP:', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch video info' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));