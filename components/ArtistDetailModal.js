'use client';

import { useEffect, useState } from 'react';

export default function ArtistDetailModal({ artistName, onClose, onSelectTrack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistName) return;

    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/artist-summary/${encodeURIComponent(artistName)}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading artist data:", err);
        setLoading(false);
      });
  }, [artistName]);

  if (!artistName) return null;

  const tracks = data?.tracks || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0D1B2A] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-xl"
        >
          ✕
        </button>

        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse font-bold">
            LOADING ARTIST SPOTLIGHT...
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full uppercase border border-amber-500/30">
                👑 Artist Spotlight
              </span>
              <h2 className="text-3xl font-black text-white mt-2">{data?.artist || artistName}</h2>
              <p className="text-slate-400 text-sm mt-1">
                Total Hits on Chart: <span className="text-white font-bold">{data?.total_tracks || tracks.length}</span>
              </p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {tracks.length === 0 ? (
                <p className="text-slate-500 text-sm">No recorded songs for this artist.</p>
              ) : (
                tracks.map((t) => (
                  <div
                    key={t.spotify_id}
                    onClick={() => {
                      onClose();
                      if (onSelectTrack) onSelectTrack(t.spotify_id);
                    }}
                    className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {t.art ? (
                        <img src={t.art} alt={t.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-800 rounded-md flex items-center justify-center text-xs">🎵</div>
                      )}
                      <p className="text-white font-bold text-sm truncate">{t.title}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs text-amber-400 font-bold">Peak #{t.peak}</p>
                      <p className="text-[11px] text-slate-400">{t.weeks} wks</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}