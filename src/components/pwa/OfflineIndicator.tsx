'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showRestored) return null;

  return (
    <aside aria-label="Network Status" className="fixed bottom-4 left-4 z-50 animate-bounce-short">
      {isOffline ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 text-xs font-semibold backdrop-blur-md border border-white/10">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>You are offline. Showing cached content.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 text-xs font-semibold backdrop-blur-md border border-white/10 animate-fade-in">
          <Wifi className="w-4 h-4" />
          <span>Connection restored! You are back online.</span>
        </div>
      )}
    </aside>
  );
}
