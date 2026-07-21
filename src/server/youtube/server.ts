import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { YtDlp } from 'ytdlp-nodejs';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

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

app.post('/api/info', async (req: Request, res: Response): Promise<void> => {
  const { videoUrl } = req.body;
  
  try {
    const rawData = await ytdlp.getFormatsAsync(videoUrl);
    const formats = Array.isArray(rawData) ? rawData : (rawData as any).formats || [];

    if (!Array.isArray(formats) || formats.length === 0) {
      throw new Error("No formats found for this video");
    }

    const options: any[] = [];
    const seenQualities = new Set();

    formats.forEach((f: any) => {
      if (f.vcodec !== 'none' && f.acodec === 'none' && f.height) {
        const quality = `${f.height}p`;
        if (!seenQualities.has(quality)) {
          seenQualities.add(quality);
          options.push({ filter: 'videoonly', type: f.ext || 'mp4', quality: quality });
        }
      }
    });

    options.push({ filter: 'audioonly', type: 'mp3', quality: 5 });

    const seenMergedQualities = new Set();
    formats.forEach((f: any) => {
      if (f.vcodec !== 'none' && f.acodec !== 'none' && f.height) {
        const quality = `${f.height}p`;
        if (!seenMergedQualities.has(quality)) {
          seenMergedQualities.add(quality);
          options.push({ filter: 'audioandvideo', type: f.ext || 'mp4', quality: quality });
        }
      }
    });

    options.push({ filter: 'audioandvideo', type: 'mp4', quality: 'highest' });

    const seenMergeQualities = new Set();
    formats.forEach((f: any) => {
      if (f.vcodec !== 'none' && f.height) {
        const quality = `${f.height}p`;
        if (!seenMergeQualities.has(quality)) {
          seenMergeQualities.add(quality);
          options.push({ filter: 'mergevideo', type: f.ext || 'mp4', quality: quality });
        }
      }
    });

    res.json({ options });
  } catch (error: any) {
    console.error('FULL ERROR FROM YTDLP:', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch video info' });
  }
});

app.post('/api/download', async (req: Request, res: Response): Promise<void> => {
  const { videoUrl, filter, type, quality } = req.body;
  const ext = type || 'mp4';
  const fileName = `vid_${Date.now()}.${ext}`;
  const fullPath = path.join(TMP_DIR, fileName);

  try {
    let command = '';

    switch (filter) {
      case 'videoonly': {
        const height = typeof quality === 'string' ? quality.replace('p', '') : '1080';
        command = `yt-dlp --extractor-args "youtube:player_client=android,web" -f "bestvideo[height<=${height}]" --remux-video ${ext} -o "${fullPath}" "${videoUrl}"`;
        break;
      }
      case 'audioonly': {
        command = `yt-dlp --extractor-args "youtube:player_client=android,web" -x --audio-format mp3 -o "${fullPath}" "${videoUrl}"`;
        break;
      }
      case 'audioandvideo': {
        if (quality === 'highest') {
          command = `yt-dlp --extractor-args "youtube:player_client=android,web" -f "bv*+ba/b" --remux-video ${ext} -o "${fullPath}" "${videoUrl}"`;
        } else {
          const height = typeof quality === 'string' ? quality.replace('p', '') : '1080';
          command = `yt-dlp --extractor-args "youtube:player_client=android,web" -f "best[height<=${height}]" --remux-video ${ext} -o "${fullPath}" "${videoUrl}"`;
        }
        break;
      }
      case 'mergevideo': {
        const height = typeof quality === 'string' ? quality.replace('p', '') : '1080';
        command = `yt-dlp --extractor-args "youtube:player_client=android,web" -f "bestvideo[height<=${height}]+bestaudio/best[height<=${height}]" --remux-video ${ext} -o "${fullPath}" "${videoUrl}"`;
        break;
      }
      default:
        if (filter === 'audioonly' || type === 'mp3' || quality === 5) {
          command = `yt-dlp --extractor-args "youtube:player_client=android,web" -x --audio-format mp3 -o "${fullPath}" "${videoUrl}"`;
        } else {
          command = `yt-dlp --extractor-args "youtube:player_client=android,web" -f "bv*+ba/b" --remux-video ${ext} -o "${fullPath}" "${videoUrl}"`;
        }
    }

    await execPromise(command);

    res.download(fullPath, `download.${ext}`);
  } catch (error: any) {
    console.error('Download process failed:', error.message);
    res.status(500).json({ error: 'Download failed: ' + error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));