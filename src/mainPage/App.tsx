import { useState, useEffect } from 'react';
import VideoEmbed from '../assets/videoEmbed';
import ModalWindow from '../assets/modalWindow';
import SearchDiv from './searchDiv';
import DownloadWindow from '../assets/downloadWindow';
import { saveKey, getKey } from '../server/cookies';

type SearchResult = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: { default?: { url?: string } };
  };
};

interface DownloadSettings {
  quality: string;
  format: string;
}

export default function App() {
  const [apiKey, setApiKey] = useState(getKey('apiKey') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [videoToDownload, setVideoToDownload] = useState<{ id: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string>();
  const [prevPageToken, setPrevPageToken] = useState<string>();

  useEffect(() => {
    if (!apiKey) setIsModalOpen(true);
  }, [apiKey]);

  const handleApiKeySubmit = (newApiKey: string) => {
    saveKey(newApiKey);
    setApiKey(newApiKey);
    setIsModalOpen(false);
  };

  const fetchPage = async (query: string, token = '') => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, pageToken: token, apiKey }),
      });
      const data = await response.json();
      if (data?.items?.length) {
        setSearchResults(data.items);
        setNextPageToken(data.nextPageToken);
        setPrevPageToken(data.prevPageToken);
        setActiveVideo(null);
      } else {
        alert('No videos found.');
        if (!token) setSearchResults([]);
      }
    } catch (error) {
      alert('Failed to search videos.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeDownload = async (id: string, title: string, settings?: DownloadSettings) => {
    setVideoToDownload(null);
    setDownloadingId(id);
    try {
      const response = await fetch('http://localhost:3000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: id.startsWith('http') ? id : `https://youtube.com/watch?v=${id}`,
          quality: settings?.quality,
          format: settings?.format,
        }),
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9а-яё]/gi, '_')}.${settings?.format || 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download video.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-transparent p-4">
      {isLoading ? (
        <div className="text-slate-900 font-bold text-xl animate-pulse">Searching...</div>
      ) : videoToDownload ? (
        <DownloadWindow
          videoSource={videoToDownload.id}
          onBack={() => setVideoToDownload(null)}
          onDownload={(e, s) => executeDownload(videoToDownload.id, videoToDownload.title, s)}
        />
      ) : activeVideo ? (
        <VideoEmbed
          videoSource={activeVideo}
          onBack={() => setActiveVideo(null)}
          onDownload={() => setVideoToDownload({ id: activeVideo, title: 'video' })}
        />
      ) : searchResults.length ? (
        <div className="bg-zinc-100 p-6 rounded shadow-lg min-w-96 flex flex-col items-center max-h-[85vh]">
          <h1 className="text-2xl font-bold mb-4 text-slate-900">Search Results</h1>
          <div className="w-full overflow-y-auto space-y-3 mb-4 pr-1 flex-1">
            {searchResults.map((v) => {
              const id = v.id?.videoId;
              if (!id) return null;
              return (
                <div key={id} onClick={() => setActiveVideo(id)} className="w-full flex gap-3 p-2 bg-white rounded cursor-pointer border hover:border-blue-400">
                  <img src={v.snippet?.thumbnails?.default?.url} className="w-24 h-16 object-cover rounded" />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-xs font-bold line-clamp-2">{v.snippet?.title}</h4>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setVideoToDownload({ id, title: v.snippet?.title || 'video' }); }} className="p-2 bg-zinc-100 hover:bg-blue-500 hover:text-white rounded">
                    {downloadingId === id ? '⏳' : '📥'}
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={() => { setSearchResults([]); setCurrentQuery(''); }} className="w-full bg-blue-600 text-white rounded py-2">Back to Search</button>
        </div>
      ) : (
        <SearchDiv onSearch={(v, isQuery) => { if (isQuery) { setCurrentQuery(v); fetchPage(v); } else { setActiveVideo(v); } }} />
      )}
      <ModalWindow isOpen={isModalOpen} onSubmit={handleApiKeySubmit} />
    </div>
  );
}