import React from 'react';
import { EDITOR_SIZE } from '../constants';
import { Mockup } from '../types';

interface ResultDisplayProps {
    generatedImage: string | null;
    selectedMockup: Mockup | null;
    isLoading: boolean;
    error: string | null;
    isUpscaling: boolean;
    onUpscale: () => void;
}

const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-gray-600 p-8" style={{ height: EDITOR_SIZE }}>
        <div className="relative h-16 w-16">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-t-4 border-indigo-600 rounded-full animate-spin"></div>
        </div>
        <span className="mt-6 text-lg font-semibold text-gray-800">AI is crafting your mockup...</span>
        <span className="mt-1 text-sm text-gray-500">This may take a moment.</span>
    </div>
);

const DownloadIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const UpscaleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({ generatedImage, selectedMockup, isLoading, error, isUpscaling, onUpscale }) => {
    return (
        <div className="w-full mt-8 fade-in-up" style={{ maxWidth: EDITOR_SIZE }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Generated Mockup</h2>
            
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/80 p-4 flex flex-col items-center transition-all duration-300">
                {isLoading && <Loader />}
                {error && !isLoading && <p className="text-red-600 text-center p-4 bg-red-50 rounded-md w-full">{error}</p>}
                
                {!isLoading && !error && !generatedImage && (
                    <div className="w-full flex items-center justify-center bg-gray-50/50 rounded-lg border-2 border-dashed" style={{ height: EDITOR_SIZE - 40 }}>
                        <p className="text-gray-500 font-medium">Your AI-generated mockup will appear here.</p>
                    </div>
                )}
                
                {generatedImage && !error && (
                    <>
                        <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-4 shadow-inner">
                           <img src={generatedImage} alt={`Generated mockup for ${selectedMockup?.name}`} className="w-full h-full object-contain" />
                        </div>
                        <div className="w-full flex items-center space-x-3">
                            <a
                                href={generatedImage}
                                download={`ai-mockup-${selectedMockup?.id || 'custom'}.png`}
                                className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105 ${isUpscaling ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-disabled={isUpscaling}
                                onClick={(e) => { if (isUpscaling) e.preventDefault(); }}
                            >
                               <DownloadIcon />
                                Download
                            </a>
                             <button
                                onClick={onUpscale}
                                disabled={isUpscaling || isLoading}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                            >
                                <UpscaleIcon />
                                {isUpscaling ? 'Upscaling...' : 'Upscale & Enhance'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResultDisplay;