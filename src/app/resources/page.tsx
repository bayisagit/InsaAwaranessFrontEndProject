'use client';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, Resource, downloadResourceFile } from '@/lib/api';
import { Button } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { LinkifyText } from '@/components/LinkifyText';
import { SupportCTA } from '@/components/SupportCTA';

export default function ResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 12;

    const fetchResources = useCallback(async () => {
        setIsLoading(true);
        setError('');
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
            ordering: '-created_at'
        });
        if (searchQuery) params.set('search', searchQuery);
        const { data, error: e } = await apiFetch(`/api/v1/resources/?${params.toString()}`);
        if (e) setError(e);
        else if (data?.results) {
            setResources(data.results);
            setTotalCount(data.count || 0);
        }
        else if (Array.isArray(data)) {
            setResources(data);
            setTotalCount(data.length);
        }
        setIsLoading(false);
    }, [page, searchQuery]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchResources();
    };

    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const downloadResource = useCallback(async (resource: Resource) => {
        if (downloadingId) return;
        setDownloadingId(resource.id);
        try {
            const url = resource.file_url?.toLowerCase() || '';
            if (url.includes('cloudinary')) {
                const sep = resource.file_url!.includes('?') ? '&' : '?';
                window.open(`${resource.file_url}${sep}fl_attachment=true`, '_blank');
            } else {
                const blob = await downloadResourceFile(resource.id);
                if (!blob) return;
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objectUrl;
                const ext = resource.file_url?.split('.').pop() || '';
                a.download = `${resource.title.replace(/\s+/g, '_')}.${ext}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(objectUrl);
            }
        } finally {
            setDownloadingId(null);
        }
    }, [downloadingId]);

    const typeIcons: Record<string, React.ReactNode> = {
        pdf: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
        video: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
        doc: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
        docx: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
        xlsx: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>,
        ppt: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>,
        link: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
    };

    const getIcon = (r: Resource) => {
        const ext = r.file_url?.split('.').pop()?.toLowerCase() || r.category?.toLowerCase() || '';
        return typeIcons[ext] || (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <PageHeader
                title="Cybersecurity Knowledge Base"
                description="Equip yourself with the latest guides, tools, and policy frameworks."
                className="w-full text-center"
            />
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-12 -mt-0 mb-12">
                <form onSubmit={handleSearch} className="max-w-xl mx-auto flex bg-white border border-gray-200 rounded-full p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary transition-all">
                    <div className="pl-4 flex items-center text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search resources..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-full px-6 py-2 text-sm font-semibold transition-colors">
                        Search
                    </button>
                </form>
            </div>

            <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
                {error && <div role="alert" className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Available Resources
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {totalCount} items
                        </span>
                    </h3>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>
                ) : resources.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        }
                        title={searchQuery ? 'No resources matched your search.' : 'No resources available yet.'}
                        description={searchQuery ? 'Try a different search term.' : 'Check back soon for new resources.'}
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {resources.map(resource => (
                                <div key={resource.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex gap-5 hover:shadow-md hover:border-primary/20 transition-all group">
                                    <div className="w-14 h-14 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                        {getIcon(resource)}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{resource.title}</h4>
                                            {resource.content && (
                                                <LinkifyText text={resource.content} className="text-xs text-gray-500 mt-1 line-clamp-2" />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                            {resource.category && (
                                                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded uppercase">
                                                    {resource.category}
                                                </span>
                                            )}
                                            {resource.file_url && (
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <a
                                                        href={resource.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-semibold text-gray-500 hover:text-primary inline-flex items-center gap-1 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.25a1.444 1.444 0 000 1.5 2.045 2.045 0 003.497.826L12 7.25l6.467 7.326a2.044 2.044 0 003.497-.826 1.444 1.444 0 000-1.5l-6.467-7.326a2.044 2.044 0 00-3.06 0L4.536 12.25z" />
                                                        </svg>
                                                        Preview
                                                    </a>
                                                    <button
                                                        onClick={() => downloadResource(resource)}
                                                        disabled={downloadingId === resource.id}
                                                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                                    >
                                                        {downloadingId === resource.id ? (
                                                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                            </svg>
                                                        )}
                                                        {downloadingId === resource.id ? 'Downloading...' : 'Download'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Pagination
                            page={page}
                            pageSize={pageSize}
                            totalCount={totalCount}
                            isLoading={isLoading}
                            onPageChange={setPage}
                            label="resources"
                        />
                    </>
                )}
            </section>

            <section className="relative py-24 bg-secondary px-4 sm:px-6 rounded-[40px] lg:px-8 text-center overflow-hidden">
                {/* Subtle gradient overlay to ensure contrast against background */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/30 pointer-events-none" />
                
                <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl font-extrabold tracking-tight text-black/70 sm:text-5xl drop-shadow-md">
                    Can't find what you're looking for?
                </h2>
                <p className="mt-6 text-xl text-black/70 max-w-2xl mx-auto drop-shadow-sm font-medium leading-relaxed">
                    Our support team is available to help citizens and organizations find the right resources.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/contact" aria-label="Create a free account">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        Contact Support
                    </Button>
                    </Link>
                    <Link href="/courses" aria-label="Explore cybersecurity resources">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-white bg-white/10 border-white/30 hover:bg-white/25 hover:border-white/60 font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all backdrop-blur-sm">
                        Explore Courses
                    </Button>
                    </Link>
                </div>
                </div>
            </section>
        </div>
    );
}
