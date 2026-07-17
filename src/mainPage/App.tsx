import { useState, useEffect } from 'react';
import VideoEmbed from '../assets/videoEmbed';
import ModalWindow from '../assets/modalWindow';
import SearchDiv from './searchDiv';
import { saveKey, getKey } from '../server/cookies';
import { searchYouTubeVideos } from '../server/youtube/search';

type SearchResult = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      default?: {
        url?: string;
      };
    };
  };
};

export default function App() {
  const [apiKey, setApiKey] = useState(getKey('apiKey') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [currentQuery, setCurrentQuery] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string>();
  const [prevPageToken, setPrevPageToken] = useState<string>();

  useEffect(() => {
    if (!apiKey) {
      setIsModalOpen(true);
    }
  }, [apiKey]);

  const handleApiKeySubmit = (newApiKey: string) => {
    saveKey(newApiKey);
    setApiKey(newApiKey);
    setIsModalOpen(false);
  };

  const fetchPage = async (query: string, token = '') => {
    setIsLoading(true);

    const data = await searchYouTubeVideos(query, token);

    setIsLoading(false);

    if (data.items.length) {
      setSearchResults(data.items);
      setNextPageToken(data.nextPageToken);
      setPrevPageToken(data.prevPageToken);
      setActiveVideo(null);
    } else {
      alert('No videos found.');
      if (!token) setSearchResults([]);
    }
  };

  const handleDownloadVideo = async (
    e: React.MouseEvent,
    videoId: string,
    videoTitle: string
  ) => {
    e.stopPropagation();
    setDownloadingId(videoId);

    try {
      const response = await fetch('http://localhost:3000/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: `https://youtube.com/watch?v=${videoId}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${videoTitle.replace(/[^a-z0-9а-яё]/gi, '_')}.mp4`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download video. Is the backend running?');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleVideoSelect = async (
    value: string,
    isSearchQuery: boolean
  ) => {
    if (isSearchQuery) {
      setCurrentQuery(value);
      await fetchPage(value);
    } else {
      setActiveVideo(value);
    }
  };

  const handleBackToResults = () => setActiveVideo(null);

  const handleCancelSearch = () => {
    setSearchResults([]);
    setActiveVideo(null);
    setCurrentQuery('');
    setNextPageToken(undefined);
    setPrevPageToken(undefined);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-transparent p-4">
      {isLoading ? (
        <div className="text-slate-900 font-bold text-xl animate-pulse">
          Searching YouTube...
        </div>
      ) : activeVideo ? (
        <VideoEmbed
          videoSource={activeVideo}
          onBack={handleBackToResults}
        />
      ) : searchResults.length ? (
        <div className="bg-zinc-100 p-6 rounded shadow-lg w-96 flex flex-col items-center max-h-[85vh]">
          <h1 className="text-2xl font-bold mb-4 text-slate-900">
            Search Results
          </h1>

          <div className="w-full overflow-y-auto space-y-3 mb-4 pr-1 flex-1">
            {searchResults.map((video) => {
              const videoId = video.id?.videoId;

              if (!videoId) return null;

              const downloading = downloadingId === videoId;

              return (
                <div
                  key={videoId}
                  onClick={() => handleVideoSelect(videoId, false)}
                  className="w-full flex gap-3 p-2 bg-white hover:bg-zinc-50 border border-gray-200 rounded cursor-pointer shadow-sm hover:border-blue-400 group"
                >
                  <img
                    src={video.snippet?.thumbnails?.default?.url ?? ''}
                    alt={video.snippet?.title ?? ''}
                    className="w-24 h-16 object-cover rounded"
                  />

                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-xs font-bold line-clamp-2">
                      {video.snippet?.title}
                    </h4>

                    <p className="text-[10px] text-gray-500 truncate">
                      {video.snippet?.channelTitle}
                    </p>
                  </div>

                  <button
                    disabled={downloadingId !== null}
                    onClick={(e) =>
                      handleDownloadVideo(
                        e,
                        videoId,
                        video.snippet?.title ?? 'video'
                      )
                    }
                    className={`p-2 rounded ${
                      downloading
                        ? 'bg-yellow-500 text-white'
                        : 'bg-zinc-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    {downloading ? '⏳' : '📥'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 w-full mb-3">
            <button
              disabled={!prevPageToken}
              onClick={() => fetchPage(currentQuery, prevPageToken)}
              className="flex-1 border rounded py-2 disabled:opacity-50"
            >
              ← Prev
            </button>

            <button
              disabled={!nextPageToken}
              onClick={() => fetchPage(currentQuery, nextPageToken)}
              className="flex-1 border rounded py-2 disabled:opacity-50"
            >
              Next →
            </button>
          </div>

          <button
            onClick={handleCancelSearch}
            className="w-full bg-blue-600 text-white rounded py-2"
          >
            Back to Search
          </button>
        </div>
      ) : (
        <SearchDiv onSearch={handleVideoSelect} />
      )}

      <ModalWindow
        isOpen={isModalOpen}
        onSubmit={handleApiKeySubmit}
      />
    </div>
  );
}