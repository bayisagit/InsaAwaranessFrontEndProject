import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';

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
        <div className="mt-20 bg-secondary rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl mix-blend-screen pointer-events-none"></div>
            <div className="absolute top-10 right-10 w-32 h-32 bg-primary rounded-full opacity-20 blur-2xl mix-blend-screen pointer-events-none"></div>

            <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">{title}</h3>
                <p className="text-gray-100 mb-8 text-base md:text-lg leading-relaxed font-medium">
                    {description}
                </p>
                <Link href={buttonHref}>
                    <Button variant="social" className="bg-white text-black hover:bg-gray-100 transition-colors">
                        {buttonText} &rarr;
                    </Button>
                </Link>
            </div>
        </div>
    );
}
