'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Authenticating with Spotify...');

  useEffect(() => {
    // 🔥 BULLETPROOF FIX: Try Next.js first, fallback to standard browser URL parsing for Cloudflare
    const code = searchParams.get('code') || new URLSearchParams(window.location.search).get('code');
    
    if (!code) {
      setStatus('No authorization code found in the URL.');
      return;
    }

    // 🚨 STRICTLY POINTED TO YOUR AZURE BACKEND
    fetch('https://tracktide-api-aeffdyfccwasf9ds.germanywestcentral-01.azurewebsites.net/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        redirect_uri: window.location.origin + '/callback'
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setStatus('Error: ' + data.error);
      } else {
        // Save the user's specific ID to local storage
        if (data.user_id) {
           localStorage.setItem('tracktide_user_id', data.user_id);
        }
        setStatus('Success! Redirecting to your Hot 100...');
        setTimeout(() => router.push('/'), 2000);
      }
    })
    .catch(err => setStatus('Fetch error: ' + err.message));
  }, [searchParams, router]);

  return (
    <div className="text-xl tracking-wider text-slate-400 animate-pulse">
      {status}
    </div>
  );
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen bg-[#050B14] text-white flex items-center justify-center font-sans">
      <Suspense fallback={<div className="text-xl tracking-wider text-slate-400 animate-pulse">Loading Spotify Connection...</div>}>
        <CallbackContent />
      </Suspense>
    </div>
  );
}