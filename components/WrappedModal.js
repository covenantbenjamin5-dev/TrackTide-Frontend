"use client";

import { useEffect, useState } from 'react';

export default function WrappedModal() {
  const [showModal, setShowModal] = useState(false);
  const [wrappedSongs, setWrappedSongs] = useState([]);
  const [wrappedArtists, setWrappedArtists] = useState([]);
  const [viewTab, setViewTab] = useState('songs'); // 'songs' | 'artists'

  useEffect(() => {
    const hasSeenWrapped = localStorage.getItem('wrapped_seen_2026');
    if (hasSeenWrapped) return;

    fetch('http://127.0.0.1:8000/api/wrapped/status')
      .then(res => res.json())
      .then(data => {
        if (data.should_show_flashcard) {
          fetch('http://127.0.0.1:8000/api/wrapped?limit=100')
            .then(res => res.json())
            .then(wrapped => {
              if (wrapped.wrapped_chart && wrapped.wrapped_chart.length > 0) {
                setWrappedSongs(wrapped.wrapped_chart);
                setWrappedArtists(wrapped.wrapped_artists || []);
                setShowModal(true);
              }
            })
            .catch(err => console.error("Error fetching Wrapped data:", err));
        }
      })
      .catch(err => console.error("Error checking Wrapped status:", err));
  }, []);

  const handleClose = () => {
    localStorage.setItem('wrapped_seen_2026', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-gradient-to-br from-purple-950 via-slate-900 to-black p-6 text-white shadow-2xl border border-purple-500/30 flex flex-col">
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold transition-colors z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-1 mb-3 flex-shrink-0">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">
            ✨ Year-End Wrapped Unlocked ✨
          </span>
          <h2 className="text-2xl font-black tracking-tight text-white">Year-End Leaderboards</h2>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center space-x-2 mb-4 flex-shrink-0">
          <button
            onClick={() => setViewTab('songs')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewTab === 'songs'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/50'
            }`}
          >
            🎵 Top 100 Songs
          </button>
          <button
            onClick={() => setViewTab('artists')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewTab === 'artists'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/50'
            }`}
          >
            👑 Top 10 Artists
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto pr-2 space-y-2.5 flex-1 custom-scrollbar">
          {viewTab === 'songs' ? (
            wrappedSongs.map((track) => (
              <div 
                key={track.spotify_id} 
                className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 hover:bg-purple-900/40 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className={`font-black text-sm md:text-base w-8 text-center flex-shrink-0 ${
                    track.overall_rank === 1 ? 'text-amber-400 text-lg' :
                    track.overall_rank === 2 ? 'text-slate-300' :
                    track.overall_rank === 3 ? 'text-amber-600' : 'text-purple-300/80'
                  }`}>
                    #{track.overall_rank}
                  </span>

                  {track.album_art ? (
                    <img 
                      src={track.album_art} 
                      alt={track.title} 
                      className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-purple-500/20" 
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-purple-900/50 flex flex-shrink-0 items-center justify-center text-xs">🎵</div>
                  )}

                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{track.title}</p>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pl-3">
                  <p className="text-xs font-bold text-purple-300">{track.total_points} pts</p>
                  <p className="text-[10px] text-gray-400">{track.weeks_charted} wks</p>
                </div>
              </div>
            ))
          ) : (
            wrappedArtists.map((artist) => (
              <div 
                key={artist.artist} 
                className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 hover:bg-purple-900/40 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className={`font-black text-sm md:text-base w-8 text-center flex-shrink-0 ${
                    artist.rank === 1 ? 'text-amber-400 text-lg' :
                    artist.rank === 2 ? 'text-slate-300' :
                    artist.rank === 3 ? 'text-amber-600' : 'text-purple-300/80'
                  }`}>
                    #{artist.rank}
                  </span>

                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{artist.artist}</p>
                    <p className="text-xs text-purple-300/80 truncate">Peak #{artist.highest_peak} • {artist.total_tracks} Charted {artist.total_tracks === 1 ? 'Track' : 'Tracks'}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pl-3">
                  <p className="text-xs font-bold text-purple-300">{artist.total_points} pts</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dismiss Button */}
        <button 
          onClick={handleClose}
          className="w-full py-3 mt-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold transition-all shadow-lg text-white flex-shrink-0"
        >
          Explore Weekly Dashboard
        </button>

      </div>
    </div>
  );
}