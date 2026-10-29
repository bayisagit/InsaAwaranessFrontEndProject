'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, X, Share, PlusSquare, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  triggerInstall: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextType>({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  triggerInstall: () => {},
});

export const usePwaInstall = () => useContext(PwaInstallContext);

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed)
    const checkIsInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkIsInstalled();

    // Check for iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Chromium desktop & mobile)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user previously dismissed prompt within the last 3 days
      const lastDismissed = localStorage.getItem('insa_pwa_dismissed');
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (!lastDismissed || Date.now() - parseInt(lastDismissed, 10) > threeDays) {
        // Show install banner with a gentle delay so initial page loads smoothly
        const timer = setTimeout(() => {
          setShowPromptBanner(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowPromptBanner(false);
      setShowIOSModal(false);
      localStorage.removeItem('insa_pwa_dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setShowPromptBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPromptBanner(false);
    localStorage.setItem('insa_pwa_dismissed', Date.now().toString());
  };

  const isInstallable = (!isInstalled && (!!deferredPrompt || isIOS));

  return (
    <PwaInstallContext.Provider value={{ isInstallable, isInstalled, isIOS, triggerInstall }}>
      {children}

      {/* Floating PWA Install Prompt Banner */}
      {showPromptBanner && !isInstalled && (
        <aside
          aria-label="Install App"
          className="fixed bottom-20 sm:bottom-5 right-3 sm:right-5 z-50 max-w-sm w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2.5rem)] bg-card/95 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl shadow-primary/10 dark:shadow-black/40 animate-slide-up transition-all"
        >
          <div className="flex items-start gap-3.5">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
              <Image
                src="/icons/icon-144x144.png"
                alt="INSA CyberSafe"
                width={48}
                height={48}
                className="w-10 h-10 object-contain"
              />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h4 className="text-sm font-bold text-foreground truncate">INSA CyberSafe</h4>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Official
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                Install our official app for quick desktop & mobile access, offline courses, and threat alerts.
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Offline Ready</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                Not Now
              </button>
              <button
                onClick={triggerInstall}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="max-w-sm w-full bg-card border border-border rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
              <Image
                src="/icons/icon-144x144.png"
                alt="INSA CyberSafe"
                width={40}
                height={40}
                className="w-8 h-8 object-contain"
              />
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">
              Install on iPhone or iPad
            </h3>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Apple Safari requires adding web apps to your Home Screen manually:
            </p>

            <ol className="space-y-3.5 text-xs text-foreground mb-6">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span className="flex-1">
                  Tap the <strong className="text-primary inline-flex items-center gap-1 mx-1"><Share className="w-3.5 h-3.5" /> Share</strong> icon in the Safari bottom bar.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span className="flex-1">
                  Scroll down and tap <strong className="inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span className="flex-1">
                  Tap <strong className="text-primary mx-1">Add</strong> in the top right corner.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-primary/20"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaInstallContext.Provider>
  );
}

/**
 * Reusable Install Button to place in Header / Navigation / Profile
 */
export function PwaInstallButton({ className = '' }: { className?: string }) {
  const { isInstallable, triggerInstall } = usePwaInstall();

  if (!isInstallable) return null;

  return (
    <button
      onClick={triggerInstall}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-primary/20 ${className}`}
      title="Install INSA CyberSafe App"
      aria-label="Install INSA CyberSafe on your device"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install App</span>
    </button>
  );
}
