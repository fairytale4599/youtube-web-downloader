import { useState, useEffect } from 'react'

interface VideoEmbedProps {
    videoSource: string; 
    onBack: () => void; 
}

export default function VideoEmbed({ videoSource, onBack }: VideoEmbedProps) {
    const [videoUrl, setVideoUrl] = useState('')

    useEffect(() => {
        if (videoSource) {
            setVideoUrl(`https://www.youtube.com/embed/${videoSource}`)
        }
    }, [videoSource]) 

    useEffect(() => {
        console.log(videoUrl)
    }, [videoUrl])

    return (
        <div className="bg-zinc-100 p-6 rounded shadow-lg w-full max-w-2xl flex flex-col items-center">
            <button 
                onClick={onBack} 
                className="self-start mb-4 text-sm font-semibold text-white hover:text-gray-300 transition-colors ease-in-out"
            >
                ← Back to Search
            </button>

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
