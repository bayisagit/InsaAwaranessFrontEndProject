'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCampaigns, Campaign } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { LinkifyText } from '@/components/LinkifyText';
import { PageHero } from '@/components/PageHero';



export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Aligning parameters with Admin logic to ensure consistent backend behavior
            const { data, error: e } = await getCampaigns({
                page: '1',
                page_size: '100',
                ordering: '-start_date'
            });

            if (e) {
                setError(e);
                setIsLoading(false);
                return;
            }

            const allResults = data?.results || (Array.isArray(data) ? data : []);
            // Filter for live and scheduled on the client side
            const filtered = (allResults as Campaign[]).filter(c =>
                c.status === 'live' || c.status === 'scheduled'
            );

            // Sort by start date (closest first)
            filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

            setCampaigns(filtered);

        } catch (err: any) {
            setError(err.message || 'Failed to fetch campaigns');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PageHero
                badge="National Initiative"
                title="Security Awareness Campaigns"
                description="Join our nation-wide efforts to foster a culture of digital resilience. Participate in active campaigns to earn exclusive rewards and certificates."
                center
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 mt-16">
                {error && <div role="alert" className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-8">{error}</div>}

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2].map(i => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>
                ) : campaigns.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        }
                        title="No active campaigns at the moment"
                        description="We are currently planning the next series of awareness events. Check back soon for new opportunities!"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {campaigns.map((camp) => (
                            <div key={camp.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-primary/20 transition-all group">
                                <div className="h-48 bg-gray-900 relative">
                                    <div className="w-full h-full bg-gradient-to-br from-secondary to-gray-900 opacity-80"></div>
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${camp.status === 'live' ? 'bg-green-500 text-white' :
                                            camp.status === 'scheduled' ? 'bg-blue-500 text-white' :
                                                'bg-gray-500 text-white'
                                            }`}>
                                            {camp.status}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                                            Starts: {new Date(camp.start_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{camp.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-8 flex-1">
                                        <LinkifyText text={camp.message} />
                                    </p>
                                    <Link href={`/courses`} className="inline-block">
                                        <button className="text-sm font-bold text-primary group-hover:underline inline-flex items-center gap-1.5">
                                            Participate Now
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
