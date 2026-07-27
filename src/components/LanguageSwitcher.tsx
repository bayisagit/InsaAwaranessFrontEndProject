'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { availableLocales } from '@/config/availableLocales';

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const current = availableLocales.find(l => l.code === currentLocale)
    ?? availableLocales.find(l => l.code === 'en')!;

  const handleChange = (code: string) => {
    document.cookie = `NEXT_LOCALE=${code}; path=/; maxAge=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setIsOpen(false);
    window.location.reload();
  };

  if (availableLocales.length <= 1) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">{current.nativeName}</span>
        <svg className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-[60] max-h-72 overflow-y-auto">
          {availableLocales.map(locale => (
            <button
              key={locale.code}
              onClick={() => handleChange(locale.code)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                locale.code === currentLocale
                  ? 'bg-primary/5 text-primary font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{locale.nativeName}</span>
              </span>
              {locale.code === currentLocale && (
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
