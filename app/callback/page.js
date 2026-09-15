'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');
  const [status, setStatus] = useState("Authenticating...");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) {
      router.push('/');
      return;
    }

    const controller = new AbortController();

    const exchangeCode = async () => {
      try {
        setStatus("Passing ticket to backend...");
        
        const backendUrl = 'https://tracktide-api-aeffdyfccwasf9ds.germanywestcentral-01.azurewebsites.net/api/auth/callback'; 
        
        // Dynamically grab the exact URL Spotify redirected you to
        const currentRedirectUri = window.location.origin + '/callback';

        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code: code,
            redirect_uri: currentRedirectUri 
          }),
          signal: controller.signal
        });

        const data = await response.json();
        
        // STRICT ERROR CHECK: Don't pretend it was successful if the backend reported an error
        if (!response.ok || data.error) {
          throw new Error(data.error || 'Backend failed to exchange the authorization code.');
        }

        console.log("Backend response:", data);
        setStatus("Authentication successful! Loading charts...");
        
        setTimeout(() => {
          router.push('/');
        }, 1000);

      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setStatus("Authentication Failed");
        }
      }
    };

    exchangeCode();

    return () => controller.abort();
  }, [code, router]);

  return (
    <main className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white p-4 font-sans bg-[url('/grid.svg')]">
      {!error ? (
        <>
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h1 className="text-2xl font-bold tracking-widest text-amber-400 uppercase">
            {status}
          </h1>
        </>
      ) : (
        <>
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-red-500 uppercase mb-2">
            {status}
          </h1>
          <p className="text-slate-400">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white font-bold transition-colors"
          >
            Return Home
          </button>
        </>
      )}
    </main>
  );
}