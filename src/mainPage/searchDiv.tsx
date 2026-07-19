import { useState } from 'react'
import { deleteKey } from '../server/cookies.js';

interface SearchDivProps {
  onSearch: (data: string, isSearchQuery: boolean) => void;
}

export default function SearchDiv({ onSearch }: SearchDivProps) {
    const [videoLink, setVideoLink] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const handleDirectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (videoLink.trim()) {
            onSearch(videoLink, false);
        }
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery, true); 
        }
    }

    return (
        <div className="bg-zinc-100 p-6 rounded shadow-lg w-96 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4 text-center">Youtube Video Downloader</h1>

            <h3 className="text-sm font-medium text-gray-700 text-center">Please enter a link to the video</h3>
            <form onSubmit={handleDirectSubmit} className="w-full flex flex-col items-center mb-6">
                <input 
                    type="text" 
                    placeholder="Enter video link" 
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    className="border p-2 rounded w-full mt-2 mb-3 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-100 ease-in"
                />
                <button 
                    type="submit"
                    className="w-full bg-gradient-to-br from-blue-400 to-slate-900 bg-[length:200%_200%] bg-[position:0%_0%] hover:bg-[position:100%_100%] text-white font-bold py-2 px-4 rounded transition-all duration-300 ease-in-out"
                >
                    Download
                </button>
            </form>
            
            <div className="w-full flex items-center justify-center gap-2 mb-4">
                <div className="h-[1px] bg-gray-300 flex-1"></div>
                <span className="text-xs font-bold text-gray-400">OR</span>
                <div className="h-[1px] bg-gray-300 flex-1"></div>
            </div>

            <h3 className="text-sm font-medium text-gray-700 text-center">Enter your video query</h3>
            <form onSubmit={handleSearchSubmit} className="w-full flex flex-col items-center">
                <input 
                    type="text" 
                    placeholder="Enter search query" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border p-2 rounded w-full mt-2 mb-3 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-100 ease-in"
                />
                <button 
                    type="submit"
                    className="w-full bg-gradient-to-br from-blue-400 to-slate-900 bg-[length:200%_200%] bg-[position:0%_0%] hover:bg-[position:100%_100%] text-white font-bold py-2 px-4 rounded transition-all duration-300 ease-in-out"
                >
                    Search
                </button>
            </form>
            <div className="w-full justify-right">
                <p className="text-xs text-gray-500 mt-2 text-right cursor-pointer" onClick={() => {deleteKey(); window.location.reload(false);}}>
                    Reset key
                </p>
            </div>
        </div>
    )
}