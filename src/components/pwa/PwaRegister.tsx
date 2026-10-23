'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker after window load for optimal performance
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available! Show update toast
              toast(
                (t) => (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">Update Available</p>
                      <p className="text-[11px] text-muted-foreground">
                        A new version of INSA CyberSafe is ready.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                        toast.dismiss(t.id);
                      }}
                      className="px-3 py-1 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                ),
                {
                  duration: 8000,
                  position: 'bottom-right',
                }
              );
            }
          });
        });

        // Auto-reload when new service worker takes over
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      } catch (error) {
        console.warn('[PWA] Service Worker registration failed:', error);
      }
    };

    window.addEventListener('load', registerSW);
    return () => window.removeEventListener('load', registerSW);
  }, []);

  return null;
}
