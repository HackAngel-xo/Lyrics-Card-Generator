import React, { forwardRef } from 'react';

interface LyricsCardProps {
  songTitle: string;
  artist: string;
  selectedLyrics: string;
  imageUrl: string;
  fontFamily: string;
  textEffectStyle: string;
}

const LyricsCard = forwardRef<HTMLDivElement, LyricsCardProps>(({ songTitle, artist, selectedLyrics, imageUrl, fontFamily, textEffectStyle }, ref) => {
  return (
    <div 
        ref={ref} 
        className="w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col justify-between text-white p-6"
    >
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={`Album art for ${songTitle}`}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 z-10"></div>
      
      {/* Content Container */}
      <div className="relative z-20 flex flex-col h-full">

        {/* Spacer */}
        <div className="flex-grow"></div>
        
        {/* Lyrics Snippet */}
        <div className="my-4">
          <p className="text-2xl md:text-3xl font-semibold text-center leading-tight whitespace-pre-line" style={{ fontFamily: fontFamily, textShadow: textEffectStyle }}>
            {selectedLyrics}
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-grow"></div>

        {/* Song Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>{songTitle}</h2>
          <h3 className="text-lg font-medium text-gray-300" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>{artist}</h3>
        </div>
      </div>
    </div>
  );
});

LyricsCard.displayName = 'LyricsCard';

export default LyricsCard;