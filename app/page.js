'use client';

import { useEffect, useState } from 'react';
import WrappedModal from '@/components/WrappedModal';
import TrackDetailModal from '@/components/TrackDetailModal';
import ArtistDetailModal from '@/components/ArtistDetailModal';

function SpotifyLoginButton() {
  const handleLogin = () => {
    const clientId = "02f83084a8324460b2fcd2f92e70dcb9"; 
    
    // Dynamically grab the domain so it works flawlessly on both Localhost and Cloudflare
    const redirectUri = window.location.origin + "/callback";
    const scopes = "user-top-read offline_access";

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

    window.location.href = authUrl;
  };

  return (
    <button onClick={handleLogin} style={{ padding: '10px 20px', backgroundColor: '#1DB954', color: 'white', borderRadius: '50px', fontWeight: 'bold' }}>
      Log in with Spotify
    </button>
  );
}

export default function BillboardChart() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Default to false for guests
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chart');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Modal Selection States
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);

  useEffect(() => {
    // Make sure this URL matches exactly where your backend is running!
    fetch('https://tracktide-api-aeffdyfccwasf9ds.germanywestcentral-01.azurewebsites.net/api/my-hot-100') 
      .then((res) => {
        if (!res.ok) throw new Error('Could not connect to FastAPI backend.');
        return res.json();
      })
      .then((data) => {
        // 🚨 THE FIX: Unlock the screen if the database exists and isn't empty
        if (data.date !== "Database Missing" && data.date !== "No Data") {
          setIsAuthenticated(true);
        }
        
        setChartData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

// 1. Grab the raw array from the backend
  const rawTracks = chartData?.chart || [];

  // 2. Filter out duplicate entries for the same song (keeps only the first instance)
  const tracks = rawTracks.filter((track, index, self) =>
    index === self.findIndex((t) => t.spotify_id === track.spotify_id)
  );

  // --- ANALYTICS CALCULATIONS ---
  const topSong = tracks.find((t) => t.rank === 1) || tracks[0];

  const greatestGainer = [...tracks]
    .filter((t) => t.status === 'rise' && typeof t.movement === 'string' && (t.movement.includes('+') || t.movement.includes('▲')))
    .sort((a, b) => {
      const valA = parseInt(a.movement.replace(/[^0-9]/g, ''), 10) || 0;
      const valB = parseInt(b.movement.replace(/[^0-9]/g, ''), 10) || 0;
      return valB - valA;
    })[0];

  // 📉 NEW: Calculate Biggest Drop
  const biggestDrop = [...tracks]
    .filter((t) => t.status === 'fall' && typeof t.movement === 'string' && t.movement.includes('▼'))
    .sort((a, b) => {
      const valA = parseInt(a.movement.replace(/[^0-9]/g, ''), 10) || 0;
      const valB = parseInt(b.movement.replace(/[^0-9]/g, ''), 10) || 0;
      return valB - valA; // Sorts largest drop magnitude first
    })[0];

  const highestDebut = [...tracks]
    .filter((t) => t.status === 'new')
    .sort((a, b) => a.rank - b.rank)[0];

  const artistCounts = {};
  tracks.forEach((t) => {
    if (t.artist) {
      const mainArtist = t.artist.split(',')[0].trim();
      artistCounts[mainArtist] = (artistCounts[mainArtist] || 0) + 1;
    }
  });

  let topArtistName = 'N/A';
  let topArtistCount = 0;
  Object.entries(artistCounts).forEach(([artist, count]) => {
    if (count > topArtistCount) {
      topArtistName = artist;
      topArtistCount = count;
    }
  });

  const sortedArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // --- BUILD SLIDESHOW EVENT ITEMS ---
  const flashSlides = [];
  if (greatestGainer) {
    flashSlides.push({
      badge: '🚀 GREATEST GAINER',
      item: greatestGainer,
      subtitle: `Climbed ${greatestGainer.movement} positions to rank #${greatestGainer.rank} this week!`,
    });
  }
  if (highestDebut) {
    flashSlides.push({
      badge: '🔥 HOT DEBUT',
      item: highestDebut,
      subtitle: `Enters the Hot 100 as the highest new entry at #${highestDebut.rank}!`,
    });
  }
  if (topSong) {
    flashSlides.push({
      badge: '🏆 CURRENT #1',
      item: topSong,
      subtitle: `Holds the coveted #1 spot on the Hot 100 chart!`,
    });
  }
  if (biggestDrop) {
    flashSlides.push({
      badge: '📉 BIGGEST DROP',
      item: biggestDrop,
      subtitle: `Fell ${biggestDrop.movement} positions down to rank #${biggestDrop.rank} this week.`,
    });
  }

  // --- AUTOMATIC SLIDE ROTATION (Every 5 seconds) ---
  useEffect(() => {
    if (flashSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % flashSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [flashSlides.length]);

  // 1. Show Loading State First
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B14] text-white flex items-center justify-center font-sans">
        <div className="text-xl tracking-wider text-slate-400 animate-pulse">
          LOADING YOUR HOT 100...
        </div>
      </div>
    );
  }

  // 2. Show Errors if the Backend is unreachable
  if (error) {
    return (
      <div className="min-h-screen bg-[#050B14] text-red-400 flex flex-col items-center justify-center font-sans p-6">
        <p className="text-xl font-bold mb-2">Backend Connection Error</p>
        <p className="text-slate-400">{error}</p>
      </div>
    );
  }

  // 3. Show Guest View ONLY if the database is genuinely missing
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white p-4 font-sans bg-[url('/grid.svg')]">
        <div className="max-w-md w-full text-center space-y-6 bg-[#0A1220]/90 p-10 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-600/20">
            <span className="text-3xl">🌊</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-white">
            Track<span className="text-red-600">Tide</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm md:text-base px-4 pb-4">
            Connect your Spotify account to instantly generate your personal Hot 100 chart based on your listening history.
          </p>
          <SpotifyLoginButton />
        </div>
      </main>
    );
  }

  const activeSlide = flashSlides[currentSlide];

  return (
    <main className="min-h-screen bg-[#050B14] text-slate-100 font-sans p-4 md:p-10">
      
      {/* ⚡ POST-CHRISTMAS WRAPPED FLASHCARD MODAL */}
      <WrappedModal />

      {/* 📈 SONG TRAJECTORY DETAIL MODAL */}
      <TrackDetailModal 
        spotifyId={selectedTrackId} 
        onClose={() => setSelectedTrackId(null)} 
      />

      {/* 👑 ARTIST SPOTLIGHT MODAL */}
      <ArtistDetailModal 
        artistName={selectedArtist} 
        onClose={() => setSelectedArtist(null)} 
        onSelectTrack={(id) => setSelectedTrackId(id)}
      />

      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <header className="border-b border-slate-800/80 pb-6 mb-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
  <div>
    <div className="inline-block bg-red-600 text-white font-black text-xs tracking-widest px-3 py-1 mb-3 uppercase shadow-md">
      Personal Charts
    </div>
    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">
      My Hot 100
    </h1>
    <p className="text-slate-400 text-sm md:text-base font-medium">
      Chart Week Ending: <span className="text-slate-200 font-semibold">{chartData?.date}</span>
    </p>
  </div>

  {/* 🚨 ADDED LOGIN BUTTON HERE FOR RE-AUTH */}
  <div className="mt-4 md:mt-0">
    <SpotifyLoginButton />
  </div>
</header>

        {/* ⚡ SLIDESHOW NEWS CARD (AUTO-PLAYING) */}
        {activeSlide && (
          <div className="mb-8 bg-gradient-to-r from-[#0D1B2A] via-[#112233] to-[#0D1B2A] border border-amber-500/40 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-500">
            
            {/* Ambient Background Glow */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              
              {/* Large Featured Artwork */}
              {activeSlide.item.art ? (
                <img
                  src={activeSlide.item.art}
                  alt={activeSlide.item.title}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-xl object-cover shadow-2xl flex-shrink-0 border border-slate-700/60 ring-2 ring-amber-500/20 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedTrackId(activeSlide.item.spotify_id)}
                />
              ) : (
                <div className="w-28 h-28 md:w-36 md:h-36 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl text-slate-600">
                  🎵
                </div>
              )}

              {/* Event Details */}
              <div className="flex-1 text-center md:text-left min-w-0">
                <div className="inline-flex items-center space-x-2 mb-2">
                  <span className="bg-amber-500 text-black font-black text-[11px] tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow">
                    {activeSlide.badge}
                  </span>
                  <span className="text-xs font-bold text-amber-300/80">
                    Week Highlights
                  </span>
                </div>
                <h2 
                  onClick={() => setSelectedTrackId(activeSlide.item.spotify_id)}
                  className="text-xl md:text-3xl font-black text-white truncate tracking-tight cursor-pointer hover:text-amber-400 transition-colors"
                >
                  {activeSlide.item.title}
                </h2>
                <p 
                  onClick={() => setSelectedArtist(activeSlide.item.artist.split(',')[0].trim())}
                  className="text-slate-300 font-semibold text-sm md:text-base truncate mb-1 cursor-pointer hover:text-red-400 transition-colors"
                >
                  {activeSlide.item.artist}
                </p>
                <p className="text-amber-200/90 text-xs md:text-sm font-medium">
                  {activeSlide.subtitle}
                </p>
              </div>

              {/* Manual Nav Controls (Desktop) */}
              {flashSlides.length > 1 && (
                <div className="hidden md:flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setCurrentSlide((prev) => (prev === 0 ? flashSlides.length - 1 : prev - 1))
                    }
                    className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-amber-500 hover:text-black text-white flex items-center justify-center transition-colors font-bold text-sm border border-slate-700"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() =>
                      setCurrentSlide((prev) => (prev + 1) % flashSlides.length)
                    }
                    className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-amber-500 hover:text-black text-white flex items-center justify-center transition-colors font-bold text-sm border border-slate-700"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Pagination Dots */}
            {flashSlides.length > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4 pt-2 border-t border-slate-800/50">
                {flashSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === idx ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🔀 NAVIGATION TABS */}
        <div className="flex space-x-2 border-b border-slate-800/80 pb-4 mb-8">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-5 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-150 ${
              activeTab === 'chart'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-[#0A1220] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🔥 Hot 100 Chart
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2 rounded-lg font-bold text-xs md:text-sm transition-all duration-150 ${
              activeTab === 'analytics'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-[#0A1220] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            📊 Leaderboard & Stats
          </button>
        </div>

        {/* ----------------- TAB 1: PURE CHART VIEW ----------------- */}
        {activeTab === 'chart' && (
          <div>
            {/* Billboard Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/80 pb-3 mb-4 px-4">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-1 text-center">Move</div>
              <div className="col-span-6">Title & Artist</div>
              <div className="col-span-2 text-center">Peak Pos</div>
              <div className="col-span-2 text-center">Weeks on Chart</div>
            </div>

            {/* Track Rows (CLICKABLE) */}
            <div className="space-y-3">
              {tracks.map((track) => (
                 <div
                  key={track.spotify_id}
                  onClick={() => setSelectedTrackId(track.spotify_id)}
                  className="grid grid-cols-12 gap-2 md:gap-4 items-center bg-[#0A1220]/70 hover:bg-[#0E1A2E] border border-slate-800/60 hover:border-slate-700/80 rounded-lg p-3 transition-all duration-150 cursor-pointer group"
                >
                  {/* Rank */}
                  <div className="col-span-2 md:col-span-1 text-center">
                    <span className="text-2xl md:text-3xl font-black text-white group-hover:text-amber-400 transition-colors">
                      {track.rank}
                    </span>
                  </div>

                  {/* Movement Badge */}
                  <div className="col-span-2 md:col-span-1 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        track.status === 'rise'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : track.status === 'fall'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : track.status === 'new'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {track.movement}
                    </span>
                  </div>

                  {/* Artwork + Title & Artist */}
                  <div className="col-span-8 md:col-span-6 flex items-center space-x-3">
                    {track.art ? (
                      <img
                        src={track.art}
                        alt={track.title}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-md object-cover shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-800 rounded-md flex-shrink-0 flex items-center justify-center text-xs text-slate-600">
                        🎵
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-white font-bold text-sm md:text-base truncate group-hover:text-amber-300 transition-colors">
                        {track.title}
                      </h2>
                      <p 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArtist(track.artist.split(',')[0].trim());
                        }}
                        className="text-slate-400 text-xs md:text-sm truncate hover:text-red-400 transition-colors"
                      >
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Peak Position */}
                  <div className="col-span-6 md:col-span-2 text-center mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/50 flex md:block justify-between items-center px-2 md:px-0">
                    <span className="md:hidden text-xs text-slate-500 uppercase font-bold">Peak:</span>
                    <span className="text-sm font-semibold text-slate-300">
                      #{track.peak}
                    </span>
                  </div>

                  {/* Weeks on Chart */}
                  <div className="col-span-6 md:col-span-2 text-center mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/50 flex md:block justify-between items-center px-2 md:px-0">
                    <span className="md:hidden text-xs text-slate-500 uppercase font-bold">Weeks:</span>
                    <span className="text-sm font-semibold text-slate-300">
                      {track.weeks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: SEPARATE ANALYTICS PAGE ----------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: #1 Song */}
              <div 
                onClick={() => topSong && setSelectedTrackId(topSong.spotify_id)}
                className="bg-[#0A1220]/90 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg cursor-pointer hover:border-amber-500/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    🥇 Current #1
                  </span>
                  <span className="text-xs font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                    #1
                  </span>
                </div>
                {topSong ? (
                  <div className="flex items-center space-x-3">
                    {topSong.art && (
                      <img src={topSong.art} alt={topSong.title} className="w-12 h-12 rounded-md object-cover flex-shrink-0 shadow" />
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{topSong.title}</p>
                      <p className="text-slate-400 text-xs truncate">{topSong.artist}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No chart data</p>
                )}
              </div>

              {/* Card 2: Greatest Gainer */}
              <div 
                onClick={() => greatestGainer && setSelectedTrackId(greatestGainer.spotify_id)}
                className="bg-[#0A1220]/90 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg cursor-pointer hover:border-emerald-500/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    🚀 Greatest Gainer
                  </span>
                  {greatestGainer && (
                    <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      {greatestGainer.movement}
                    </span>
                  )}
                </div>
                {greatestGainer ? (
                  <div className="flex items-center space-x-3">
                    {greatestGainer.art && (
                      <img src={greatestGainer.art} alt={greatestGainer.title} className="w-12 h-12 rounded-md object-cover flex-shrink-0 shadow" />
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{greatestGainer.title}</p>
                      <p className="text-slate-400 text-xs truncate">Rank #{greatestGainer.rank} • {greatestGainer.artist}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No gains recorded this week</p>
                )}
              </div>

              {/* Card 3: Highest Debut */}
              <div 
                onClick={() => highestDebut && setSelectedTrackId(highestDebut.spotify_id)}
                className="bg-[#0A1220]/90 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg cursor-pointer hover:border-amber-500/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    🔥 Highest Debut
                  </span>
                  {highestDebut && (
                    <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                      NEW
                    </span>
                  )}
                </div>
                {highestDebut ? (
                  <div className="flex items-center space-x-3">
                    {highestDebut.art && (
                      <img src={highestDebut.art} alt={highestDebut.title} className="w-12 h-12 rounded-md object-cover flex-shrink-0 shadow" />
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{highestDebut.title}</p>
                      <p className="text-slate-400 text-xs truncate">Debut at #{highestDebut.rank}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No new entries this week</p>
                )}
              </div>

              {/* Card: Biggest Drop */}
              <div 
                onClick={() => biggestDrop && setSelectedTrackId(biggestDrop.spotify_id)}
                className="bg-[#0A1220]/90 border border-red-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg cursor-pointer hover:border-red-500/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                    📉 Biggest Drop
                  </span>
                  {biggestDrop && (
                    <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                      {biggestDrop.movement}
                    </span>
                  )}
                </div>
                {biggestDrop ? (
                  <div className="flex items-center space-x-3">
                    {biggestDrop.art && (
                      <img src={biggestDrop.art} alt={biggestDrop.title} className="w-12 h-12 rounded-md object-cover flex-shrink-0 shadow" />
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{biggestDrop.title}</p>
                      <p className="text-slate-400 text-xs truncate">Rank #{biggestDrop.rank} • {biggestDrop.artist}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No drops recorded this week</p>
                )}
              </div>

              {/* Card 4: Top Dominant Artist */}
              <div 
                onClick={() => topArtistName !== 'N/A' && setSelectedArtist(topArtistName)}
                className="bg-[#0A1220]/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg cursor-pointer hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    👑 Top Dominant Artist
                  </span>
                  <span className="text-xs font-bold bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded">
                    {topArtistCount} Tracks
                  </span>
                </div>
                <div>
                  <p className="text-white font-bold text-lg truncate">{topArtistName}</p>
                  <p className="text-slate-400 text-xs mt-1">Most entries on chart</p>
                </div>
              </div>

            </section>

            {/* Top 5 Artists Leaderboard Table */}
            <div className="bg-[#0A1220]/80 border border-slate-800/80 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">
                🏆 Dominant Artists Leaderboard (Top 5)
              </h3>
              <div className="space-y-3">
                {sortedArtists.map(([artist, count], idx) => (
                  <div 
                    key={artist} 
                    onClick={() => setSelectedArtist(artist)}
                    className="flex items-center justify-between p-3 bg-slate-900/50 hover:bg-slate-800/80 rounded-lg border border-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-500 font-bold text-sm w-6">#{idx + 1}</span>
                      <span className="text-white font-bold text-sm">{artist}</span>
                    </div>
                    <span className="text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                      {count} {count === 1 ? 'Track' : 'Tracks'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}