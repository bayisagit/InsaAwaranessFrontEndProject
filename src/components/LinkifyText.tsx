'use client';

import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

interface LinkifyTextProps {
    text: string;
    className?: string;
}

export function LinkifyText({ text, className = '' }: LinkifyTextProps) {
    const parts = text.split(URL_REGEX);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (URL_REGEX.test(part)) {
                    // Reset regex state since we already matched
                    URL_REGEX.lastIndex = 0;
                    return (
                        <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm rounded-lg transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {part.length > 50 ? part.slice(0, 47) + '...' : part.replace(/^https?:\/\//, '')}
                        </a>
                    );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </span>
    );
}
