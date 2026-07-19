import { useState, useEffect } from 'react'

interface VideoEmbedProps {
    videoSource: string; 
    onBack: () => void; 
    onDownload: (e?: React.MouseEvent) => void;
}

const extractYouTubeId = (urlOrId: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = urlOrId.match(regex);
    return match ? match[1] : urlOrId; 
};

export default function VideoEmbed({ videoSource, onBack, onDownload }: VideoEmbedProps) {
    const [videoUrl, setVideoUrl] = useState('')

    useEffect(() => {
        if (videoSource) {
            const videoId = extractYouTubeId(videoSource);
            setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
        }
    }, [videoSource]) 

    return (
        <div className="bg-zinc-100 p-6 rounded shadow-lg w-full max-w-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
                <button 
                    onClick={onBack} 
                    className="text-sm font-semibold text-white hover:text-gray-300 transition-colors ease-in-out"
                >
                    ← Back to Search
                </button>
                <button 
                    onClick={onDownload} 
                    className="text-sm font-semibold text-white hover:text-gray-300 transition-colors ease-in-out"
                >
                    Download video
                </button>
            </div>

            <div className="w-full aspect-video rounded overflow-hidden shadow-md bg-black">
                {videoUrl ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={videoUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                        <p>Loading video...</p>
                    </div>
                )}
            </div>
        </div>
    )
}