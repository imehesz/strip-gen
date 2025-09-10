import React, { useState } from 'react';
import type { ComicPanel } from '@/types';

interface ComicDisplayProps {
  panels: ComicPanel[];
}

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


const ComicDisplay: React.FC<ComicDisplayProps> = ({ panels }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPanel = (panel: ComicPanel, index: number) => {
        const link = document.createElement('a');
        link.href = panel.image;
        link.download = `comic-panel-${index + 1}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadStrip = async () => {
        setIsDownloading(true);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("Could not get canvas context");
            setIsDownloading(false);
            return;
        }

        const panelWidth = 800;
        const panelHeight = panelWidth * (9 / 16); // 16:9 aspect ratio
        const textHeight = 70;
        const gap = 20;
        const padding = 30;
        const totalPanels = panels.length;
        
        canvas.width = (panelWidth * totalPanels) + (gap * (totalPanels - 1)) + (padding * 2);
        canvas.height = panelHeight + textHeight + (padding * 2);

        // Fill background
        ctx.fillStyle = '#111827'; // bg-gray-900
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const imagePromises = panels.map(panel => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Failed to load image: ${panel.image.substring(0, 50)}...`));
            img.src = panel.image;
        }));

        try {
            const loadedImages = await Promise.all(imagePromises);
            
            loadedImages.forEach((img, index) => {
                const panel = panels[index];
                const x = padding + index * (panelWidth + gap);
                const y = padding;
                
                // Draw panel container
                ctx.fillStyle = '#1f2937'; // bg-gray-800
                ctx.strokeStyle = '#374151'; // border-gray-700
                ctx.lineWidth = 2;
                ctx.fillRect(x - (gap/2), y - (gap/2), panelWidth + gap, panelHeight + textHeight + gap);
                ctx.strokeRect(x - (gap/2), y - (gap/2), panelWidth + gap, panelHeight + textHeight + gap);

                // Draw image
                ctx.drawImage(img, x, y, panelWidth, panelHeight);

                // Draw text
                if (panel.text) {
                    ctx.fillStyle = 'white';
                    ctx.font = 'italic 20px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const textX = x + panelWidth / 2;
                    const textY = y + panelHeight + (textHeight / 2);
                    ctx.fillText(`"${panel.text}"`, textX, textY);
                }
            });

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.download = 'ai-comic-strip.jpeg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Error drawing comic strip to canvas:", error);
            alert("Sorry, there was an error creating the download. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

  return (
    <div className="mt-8 w-full">
        <div className="text-center mb-6">
            <h2 style={{fontFamily: 'Bangers, cursive'}} className="text-4xl md:text-5xl text-yellow-400 tracking-wider">Your Comic Strip!</h2>
            <button
                onClick={handleDownloadStrip}
                disabled={isDownloading}
                style={{fontFamily: 'Bangers, cursive'}}
                className="mt-4 px-8 py-3 text-xl tracking-wider text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 disabled:transform-none"
            >
                {isDownloading ? 'Preparing...' : 'Download Comic'}
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 bg-gray-900 p-4 rounded-lg border-2 border-gray-700">
            {panels.map((panel, index) => (
                <div key={index} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 flex flex-col group relative">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-700">
                         <img src={panel.image} alt={`Comic panel ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                     <button
                        onClick={() => handleDownloadPanel(panel, index)}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label={`Download panel ${index + 1}`}
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                    <div className="p-4 flex-grow min-h-[60px] flex items-center justify-center">
                        {panel.text && (
                             <p className="text-white text-center font-sans italic">"{panel.text}"</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default ComicDisplay;