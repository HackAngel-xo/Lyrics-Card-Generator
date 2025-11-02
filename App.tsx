import React, { useState, useRef, useCallback } from 'react';
import { fetchSongInfo, generateAlbumArt } from './services/geminiService';
import type { SongInfo } from './types';
import LyricsCard from './components/LyricsCard';
import Loader from './components/Loader';
import { DownloadIcon, SparklesIcon } from './components/Icons';
import * as htmlToImage from 'html-to-image';

type AppState = 'idle' | 'loadingInfo' | 'selectingLyrics' | 'cardReady';

const fontOptions = [
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Lora', family: "'Lora', serif" },
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Roboto Slab', family: "'Roboto Slab', serif" },
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
];

const effectOptions = [
  { name: 'Shadow', style: '0 2px 8px rgba(0,0,0,0.8)' },
  { name: 'Outline', style: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' },
  { name: 'Glow', style: '0 0 5px rgba(255, 255, 255, 0.7), 0 0 10px rgba(255, 255, 255, 0.5)' },
  { name: 'None', style: 'none' },
];

const App: React.FC = () => {
  const [songInput, setSongInput] = useState<string>('');
  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const [selectedLyrics, setSelectedLyrics] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState<string>(fontOptions[0].family);
  const [selectedEffect, setSelectedEffect] = useState<string>(effectOptions[0].style);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    setSongInput('');
    setSongInfo(null);
    setSelectedLyrics('');
    setGeneratedImageUrl(null);
    setError(null);
    setAppState('idle');
    setSelectedFont(fontOptions[0].family);
    setSelectedEffect(effectOptions[0].style);
  };

  const handleFindSong = async () => {
    if (!songInput.trim()) {
      setError('Please enter a song title and artist.');
      return;
    }
    setAppState('loadingInfo');
    setError(null);
    setSongInfo(null);
    setGeneratedImageUrl(null);

    try {
      // Fetch song info first
      const info = await fetchSongInfo(songInput);
      setSongInfo(info);
      setSelectedLyrics(info.fullLyrics);
      setAppState('selectingLyrics');

      // Generate album art in the background
      const artPrompt = `A vibrant, high-resolution, vertical (9:16 aspect ratio) phone wallpaper inspired by this description: ${info.albumArtDescription}. Style: digital painting, cinematic lighting, atmospheric.`;
      const imageUrl = await generateAlbumArt(artPrompt);
      setGeneratedImageUrl(imageUrl);

    } catch (err) {
      console.error(err);
      setError('Failed to find song details. Please try a different song or check the console.');
      setAppState('idle');
    }
  };
  
  const handleCreateCard = () => {
    if (!selectedLyrics.trim()) {
      setError("Please select some lyrics first.");
      return;
    }
    setAppState('cardReady');
  }

  const handleDownload = useCallback(() => {
    if (cardRef.current === null) {
      return;
    }

    htmlToImage.toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        const fileName = songInfo ? `${songInfo.artist.replace(/\s+/g, '_')}-${songInfo.songTitle.replace(/\s+/g, '_')}-lyrics.png` : 'lyrics-card.png';
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Oops, something went wrong!', err);
        setError('Could not download the image. Please try again.');
      });
  }, [songInfo]);

  const renderContent = () => {
    switch (appState) {
      case 'loadingInfo':
        return (
          <div className="text-center p-8 flex flex-col items-center gap-4">
            <Loader />
            <div className="animate-pulse text-lg text-gray-400">Searching for your song...</div>
          </div>
        );
      
      case 'selectingLyrics':
        return songInfo && (
          <div className="w-full max-w-lg flex flex-col items-center gap-6 animate-fade-in">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{songInfo.songTitle}</h2>
                <p className="text-md text-gray-400">{songInfo.artist}</p>
            </div>
            <div className="w-full">
                <label htmlFor="lyrics" className="block text-sm font-medium text-gray-300 mb-2">Edit your favorite lyrics:</label>
                <textarea
                    id="lyrics"
                    value={selectedLyrics}
                    onChange={(e) => setSelectedLyrics(e.target.value)}
                    rows={8}
                    className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
            </div>
            <button
                onClick={handleCreateCard}
                disabled={!generatedImageUrl}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all shadow-lg hover:shadow-green-500/50 w-full"
            >
              {!generatedImageUrl ? (
                <>
                  <Loader/>
                  <span className="ml-2">Generating Art...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Create Card
                </>
              )}
            </button>
          </div>
        );

      case 'cardReady':
        return songInfo && generatedImageUrl && (
          <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
              <LyricsCard
                ref={cardRef}
                songTitle={songInfo.songTitle}
                artist={songInfo.artist}
                selectedLyrics={selectedLyrics}
                imageUrl={generatedImageUrl}
                fontFamily={selectedFont}
                textEffectStyle={selectedEffect}
              />
              <div className="w-full max-w-sm">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="font-select" className="block text-sm font-medium text-gray-300 mb-2">Lyrics Font:</label>
                      <select
                        id="font-select"
                        value={selectedFont}
                        onChange={(e) => setSelectedFont(e.target.value)}
                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      >
                        {fontOptions.map(font => (
                          <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="effect-select" className="block text-sm font-medium text-gray-300 mb-2">Text Effect:</label>
                      <select
                        id="effect-select"
                        value={selectedEffect}
                        onChange={(e) => setSelectedEffect(e.target.value)}
                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      >
                        {effectOptions.map(effect => (
                          <option key={effect.name} value={effect.style}>{effect.name}</option>
                        ))}
                      </select>
                    </div>
                 </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button
                      onClick={handleDownload}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/50 w-full"
                  >
                      <DownloadIcon className="w-5 h-5 mr-2" />
                      Download
                  </button>
                  <button
                      onClick={handleReset}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center transition-all w-full"
                  >
                      Start Over
                  </button>
                </div>
              </div>
          </div>
        );

      case 'idle':
      default:
        return (
          <div className="text-center text-gray-500 mt-10 p-8 border-2 border-dashed border-gray-700 rounded-xl">
              <p>Your generated card will appear here.</p>
          </div>
        );
    }
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center p-4 sm:p-8 transition-colors duration-500">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <header className="text-center mb-8">
           <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            Lyrics Card Generator
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Turn your favorite song lyrics into stunning, shareable art.
          </p>
        </header>

        {appState !== 'cardReady' && (
          <div className="w-full max-w-lg mb-8">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={songInput}
                onChange={(e) => setSongInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFindSong()}
                placeholder="e.g., Bohemian Rhapsody - Queen"
                className="flex-grow bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                disabled={appState === 'loadingInfo' || appState === 'selectingLyrics'}
              />
              <button
                onClick={handleFindSong}
                disabled={appState === 'loadingInfo' || appState === 'selectingLyrics'}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/50"
              >
                Find Song
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 my-4 text-center p-3 bg-red-900/50 rounded-lg">{error}</p>}
        
        <main className="w-full flex flex-col items-center">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;