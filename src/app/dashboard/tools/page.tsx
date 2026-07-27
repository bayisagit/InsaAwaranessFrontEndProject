'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { getPublicAwarenessTools, recordAwarenessToolUsage, AwarenessTool } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { LinkifyText } from '@/components/LinkifyText';

const toolThemes: Record<string, { icon: React.ReactNode; color: string }> = {
    'phishing': {
        icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>,
        color: 'bg-red-50 text-red-600'
    },
    'password': {
        icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
        color: 'bg-blue-50 text-blue-600'
    },
    'assessment': {
        icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
        color: 'bg-purple-50 text-purple-600'
    },
    'default': {
        icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-7.18-4.11m0 0l7.18-4.11m-7.18 4.11v6.16c0 .77.46 1.47 1.18 1.77l6.18 2.57m0-10.5l7.18-4.11m0 0l-7.18-4.11m7.18 4.11v6.16c0 .77-.46 1.47-1.18 1.77l-6.18 2.57M12 21.5V3" /></svg>,
        color: 'bg-muted text-muted-foreground'
    }
};

export default function DashboardToolsLandingPage() {
    const { isAuthenticated } = useAuth();
    const [tools, setTools] = useState<AwarenessTool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        setIsLoading(true);
        const { data, error: e } = await getPublicAwarenessTools();
        if (e) setError(e);
        else if (data?.results) setTools(data.results);
        else if (Array.isArray(data)) setTools(data as any);
        setIsLoading(false);
    };

    const getTheme = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('phish')) return toolThemes.phishing;
        if (lowerName.includes('password')) return toolThemes.password;
        if (lowerName.includes('assessment') || lowerName.includes('test')) return toolThemes.assessment;
        return toolThemes.default;
    };

    const getHref = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('phish')) return '/dashboard/tools/phishing';
        if (lowerName.includes('password')) return '/dashboard/tools/password-strength';
        if (lowerName.includes('assessment') || lowerName.includes('test')) return '/dashboard/tools/self-assessment';
        return '#';
    };

    const handleLaunch = async (tool: AwarenessTool) => {
        const href = getHref(tool.name);
        if (href !== '#') {
            if (isAuthenticated) {
                await recordAwarenessToolUsage({
                    tool: tool.id,
                    action: 'use',
                    metadata: JSON.stringify({ tool_name: tool.name })
                });
            }
        }
    };

    return (
        <div className="pb-20">
            <PageHeader
                title="Awareness Tools"
                description="Practical, hands-on tools designed to build your digital defenses and prepare you for real-world cyber threats."
                className="w-full text-center"
            />

            <div className="max-w-5xl mx-auto mt-16">
                {error && <div role="alert" className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-8">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <CardSkeleton key={i} />
                        ))
                    ) : tools.length === 0 ? (
                        <div className="md:col-span-3">
                            <EmptyState
                                icon={
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                }
                                title="No interactive tools available"
                                description="We are currently developing new awareness tools. Please check back later!"
                            />
                        </div>
                    ) : (
                        tools.map((tool) => {
                            const theme = getTheme(tool.name);
                            const href = getHref(tool.name);
                            return (
                                <div key={tool.id} className="bg-card rounded-3xl p-8 border border-border shadow-sm shadow-black/5 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
                                    <div className={`w-20 h-20 rounded-2xl ${theme.color} flex items-center justify-center mb-6 shadow-sm shadow-black/5 dark:shadow-none group-hover:scale-110 transition-transform`}>
                                        {theme.icon}
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground mb-3">{tool.name}</h2>
                                    <p className="text-sm text-muted-foreground mb-8 flex-1 leading-relaxed">
                                        <LinkifyText text={tool.description} />
                                    </p>
                                    <Link href={href} className="w-full" onClick={() => handleLaunch(tool)}>
                                        <Button variant="primary" className="w-full" disabled={href === '#'}>
                                            Launch Tool
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </Button>
                                    </Link>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-20 bg-primary rounded-[2.5rem] p-12 text-white flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="flex-1 text-center lg:text-left">
                        <h3 className="text-3xl font-extrabold mb-4">Earn Badges while you learn</h3>
                        <p className="text-primary-100 mb-8 max-w-xl">
                            Completing awareness tools and quizzes awards points and badges to your profile. Compete with your organization and build a safer digital environment.
                        </p>
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                                Phishing Hunter
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                                Password Shield
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 019.348-4.838m0 0a60.537 60.537 0 019.348 4.838m-9.348-4.838V3.5m0 3.809a60.44 60.44 0 01-9.348 4.838m9.348-4.838v6.481m0 0a60.492 60.492 0 01-9.348 4.838m9.348-4.838v6.481m0 0a60.42 60.42 0 019.348-4.838m0 0a60.49 60.49 0 019.348 4.838m-9.348-4.838V21" />
                                </svg>
                                Awareness Graduate
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
