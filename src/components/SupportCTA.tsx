'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { useTranslations } from 'next-intl';

interface SupportCTAProps {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonHref?: string;
}

export function SupportCTA({
    title = "Can't find what you're looking for?",
    description = "Our dedicated cyber intelligence support experts are available 24/7 to assist citizens and organizations with specific security challenges.",
    buttonText = "Contact Support",
    buttonHref = "/contact"
}: SupportCTAProps) {
    return (
        <div className="mt-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden border border-slate-800 shadow-2xl">
            {/* Background Decorations */}
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            <div className="absolute top-10 right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl mix-blend-screen pointer-events-none"></div>

            <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight drop-shadow-sm">{title}</h3>
                <p className="text-slate-300 mb-8 text-base md:text-lg leading-relaxed font-normal">
                    {description}
                </p>
                <Link href={buttonHref}>
                    <Button variant="primary" size="lg" className="px-8 font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        {buttonText} &rarr;
                    </Button>
                </Link>
            </div>
        </div>
    );
}
