import React, { useEffect, useState } from 'react';

interface DownloadSettings {
    quality: string;
    format: string;
}

interface VideoMetadata {
    videoFormats: string[];
    videoQuality: string[];
}

interface DownloadWindowProps {
    videoSource: string; 
    onBack: () => void; 
    onDownload: (e?: React.MouseEvent, settings?: DownloadSettings) => void;
}

const extractYouTubeId = (urlOrId: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = urlOrId.match(regex);
    return match ? match[1] : urlOrId; 
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function DownloadWindow({ videoSource, onBack, onDownload }: DownloadWindowProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [availableFormats, setAvailableFormats] = useState<string[]>([]);
    const [availableQualities, setAvailableQualities] = useState<string[]>([]);

    const [quality, setQuality] = useState('');
    const [format, setFormat] = useState('');

    useEffect(() => {
        const fetchInfo = async () => {
            if (!videoSource) return;

            setIsLoading(true);
            setError(null);

            const videoId = extractYouTubeId(videoSource);
            const finalUrl = `https://www.youtube.com/watch?v=${videoId}`;

            try {
                const response = await fetch(`${API_BASE_URL}/api/info`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrl: finalUrl }),
                });

                if (!response.ok) throw new Error('Failed to fetch video info');

                const data: VideoMetadata = await response.json();

                setAvailableFormats(data.videoFormats);
                setAvailableQualities(data.videoQuality);

                if (data.videoFormats.length > 0) setFormat(data.videoFormats[0]);
                if (data.videoQuality.length > 0) setQuality(data.videoQuality[0]);

            } catch (err) {
                console.error(err);
                setError('Could not load download options.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInfo();
    }, [videoSource]);

    const handleDownloadClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onDownload(e, { quality, format });
    };

    const isAudioFormat = (fmt: string) => ['mp3', 'm4a', 'weba', 'wav'].includes(fmt);

    return (
        <div className="bg-zinc-100 p-6 rounded shadow-lg w-full max-w-md flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Download Settings</h2>

            {isLoading ? (
                <div className="w-full flex justify-center py-6">
                    <p className="text-blue-600 font-semibold animate-pulse">Loading formats...</p>
                </div>
            ) : error ? (
                <div className="w-full text-center py-6 text-red-500 font-medium">
                    {error}
                </div>
            ) : (
                <div className="w-full space-y-4 mb-6">
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Format</label>
                        <select 
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="p-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {availableFormats.map((fmt) => (
                                <option key={fmt} value={fmt}>
                                    {fmt.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Quality</label>
                        <select 
                            value={quality}
                            onChange={(e) => setQuality(e.target.value)}
                            disabled={isAudioFormat(format)}
                            className="p-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                        >
                            {isAudioFormat(format) ? (
                                <option>Audio Only</option>
                            ) : availableQualities.length > 0 ? (
                                availableQualities.map((q) => (
                                    <option key={q} value={q}>{q}</option>
                                ))
                            ) : (
                                <option>Default</option>
                            )}
                        </select>
                    </div>
                </div>
            )}

            <div className="flex w-full gap-3">
                <button 
                    onClick={onBack}
                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-800 font-semibold rounded hover:bg-gray-400 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleDownloadClick}
                    disabled={isLoading || !!error}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Download
                </button>
            </div>
        </div>
    );
}