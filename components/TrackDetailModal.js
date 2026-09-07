'use client';

import { useEffect, useState } from 'react';

export default function TrackDetailModal({ spotifyId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!spotifyId) return;

    setLoading(true);
    fetch(`https://tracktide-api-aeffdyfccwasf9ds.germanywestcentral-01.azurewebsites.net/api/track-history/${spotifyId}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading track history:", err);
        setLoading(false);
      });
  }, [spotifyId]);

  if (!spotifyId) return null;

  const history = data?.history || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0D1B2A] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-xl z-10"
        >
          ✕
        </button>

        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse font-bold">
            LOADING TRACK TRAJECTORY...
          </div>
        ) : (
          <div>
            {/* Header Info */}
            <div className="flex items-center space-x-4 mb-4">
              {data?.art ? (
                <img
                  src={data.art}
                  alt={data.title}
                  className="w-16 h-16 rounded-xl object-cover shadow-lg border border-slate-700"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-xl">
                  🎵
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-black text-white truncate">{data?.title}</h2>
                <p className="text-slate-400 text-sm truncate">{data?.artist}</p>
                <div className="flex items-center space-x-3 mt-1 text-xs">
                  <span className="text-amber-400 font-bold">Peak: #{data?.peak}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-semibold">{data?.weeks} Weeks on Chart</span>
                </div>
              </div>
            </div>

            {/* 🎧 EMBEDDED SPOTIFY PLAYER WIDGET */}
            <div className="mb-5">
              <iframe
                src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl shadow-md border border-slate-800"
              ></iframe>
            </div>

            {/* Trajectory Section */}
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Chart Trajectory
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm">No chart history recorded.</p>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 bg-slate-900/50 rounded-lg text-sm border border-slate-800"
                  >
                    <span className="text-slate-400 text-xs">{item.date}</span>
                    <span className="font-bold text-white">Rank #{item.rank}</span>
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