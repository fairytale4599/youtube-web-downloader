import React, { useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onSubmit: (key: string) => void;
}

export default function ModalWindow({ isOpen, onSubmit }: ModalProps) {
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(apiKey);
    };

    return (
        <div 
            className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 transition-all duration-300 ease-out
                ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
            `}
        >
            <div 
                className={`bg-zinc-100 p-6 rounded shadow-lg w-96 flex flex-col items-center transform transition-all duration-300 ease-out
                    ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
                `}
            >
                <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                <h2 className="text-center">We couldn't find your API key. Please enter it!</h2>
                
                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                    <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                    />
                    <button 
                        type="submit" 
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
}
