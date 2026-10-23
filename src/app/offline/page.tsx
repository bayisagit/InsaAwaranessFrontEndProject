'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : false);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setIsChecking(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-xl shadow-black/5 dark:shadow-black/20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
          <WifiOff className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 bg-destructive/10 text-destructive border border-destructive/20">
          <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />
          Offline Mode
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          No Internet Connection
        </h1>

        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          You are currently offline. The INSA CyberSafe portal has preserved your cached session, but live updates, courses, and security advisories require a network connection.
        </p>

        {isOnline && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Connection restored! Click below to reconnect.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Retry Connection'}
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold transition-all border border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Home
          </Link>
        </div>

        <div className="pt-6 border-t border-border/60 text-left">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-primary" />
            Offline Tips
          </h2>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Verify your Wi-Fi, Ethernet, or mobile data is turned on.</li>
            <li>Previously cached course pages and guides remain available.</li>
            <li>The app will automatically reconnect as soon as signal returns.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
