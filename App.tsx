import React, { useState, useCallback } from 'react';
import CharacterUploader from './components/CharacterUploader';
import ComicDisplay from './components/ComicDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { generateComicStrip } from './services/geminiService';
import type { ComicPanel, CharacterImage } from './types';

const App: React.FC = () => {
    const [characters, setCharacters] = useState<(CharacterImage | null)[]>([null, null, null]);
    const [story, setStory] = useState<string>('');
    const [includeText, setIncludeText] = useState<boolean>(true);
    const [numPanels, setNumPanels] = useState<number>(3);
    const [comicPanels, setComicPanels] = useState<ComicPanel[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (index: number, image: CharacterImage) => {
        setCharacters(prev => {
            const newCharacters = [...prev];
            newCharacters[index] = image;
            return newCharacters;
        });
    };

    const handleImageRemove = (index: number) => {
        setCharacters(prev => {
            const newCharacters = [...prev];
            newCharacters[index] = null;
            return newCharacters;
        });
    };
    
    const canGenerate = characters.some(c => c !== null) && story.trim().length > 10;

    const handleGenerate = useCallback(async () => {
        const uploadedCharacters = characters.filter((c): c is CharacterImage => c !== null);
        if (uploadedCharacters.length === 0) {
            setError("Please upload at least one character image.");
            return;
        }
        if (story.trim().length < 10) {
            setError("Please write a short story (at least 10 characters).");
            return;
        }

        setIsLoading(true);
        setError(null);
        setComicPanels(null);

        try {
            const panels = await generateComicStrip(story, uploadedCharacters, includeText, numPanels);
            setComicPanels(panels);
        } catch (err: any) {
            console.error("Error generating comic strip:", err);
            setError(err.message || "An unknown error occurred while creating your comic.");
        } finally {
            setIsLoading(false);
        }
    }, [characters, story, includeText, numPanels]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
            <header className="w-full max-w-5xl text-center mb-8">
                <h1 style={{fontFamily: 'Bangers, cursive'}} className="text-5xl md:text-7xl font-bold text-yellow-400 tracking-wider">
                    AI Comic Strip Generator
                </h1>
                <p className="mt-2 text-lg text-gray-300">Bring your stories to life, one panel at a time!</p>
            </header>

            <main className="w-full max-w-5xl flex flex-col items-center">
                <div className="w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 md:p-8">
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">1. Create Your Characters</h2>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 md:gap-10">
                            {[0, 1, 2].map(index => (
                                <CharacterUploader
                                    key={index}
                                    index={index}
                                    image={characters[index]}
                                    onImageChange={handleImageChange}
                                    onImageRemove={handleImageRemove}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">2. Write a Short, Funny Story</h2>
                        <textarea
                            value={story}
                            onChange={(e) => setStory(e.target.value)}
                            placeholder="e.g., A brave knight, a talking cat, and a wizard walk into a cafe. The cat orders a latte with extra foam."
                            className="w-full h-32 p-4 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 placeholder-gray-500"
                            aria-label="Your short story"
                        />
                    </section>
                    
                     <section className="mb-8">
                        <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">3. Choose Panel Count ({numPanels})</h2>
                        <div className="flex items-center gap-4 px-2">
                             <span className="font-bold text-lg text-gray-400">1</span>
                             <input
                                type="range"
                                min="1"
                                max="6"
                                step="1"
                                value={numPanels}
                                onChange={(e) => setNumPanels(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                aria-label="Number of comic panels"
                            />
                            <span className="font-bold text-lg text-gray-400">6</span>
                        </div>
                    </section>

                    <div className="flex items-center justify-center mb-6">
                        <input
                            type="checkbox"
                            id="include-text"
                            checked={includeText}
                            onChange={(e) => setIncludeText(e.target.checked)}
                            className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-offset-gray-800 focus:ring-2"
                        />
                        <label htmlFor="include-text" className="ml-3 text-lg text-gray-300 select-none cursor-pointer">
                            Include text & speech bubbles
                        </label>
                    </div>

                    <div className="text-center">
                         <button
                            onClick={handleGenerate}
                            disabled={!canGenerate || isLoading}
                            style={{fontFamily: 'Bangers, cursive'}}
                            className="px-12 py-4 text-2xl tracking-wider text-white bg-purple-600 rounded-lg shadow-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 disabled:transform-none"
                            aria-label="Generate comic strip"
                        >
                            {isLoading ? 'Creating...' : 'Generate Comic!'}
                        </button>
                    </div>
                </div>

                <div className="w-full mt-8">
                    {isLoading && <LoadingSpinner />}
                    {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center" role="alert">{error}</div>}
                    {comicPanels ? (
                         <ComicDisplay panels={comicPanels} />
                    ) : (
                        !isLoading && !error && (
                            <div className="text-center text-gray-500 p-8 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
                                <h3 className="text-2xl font-semibold mb-2">Your comic awaits!</h3>
                                <p>Upload your characters, write a story, and hit "Generate" to see the magic happen.</p>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;