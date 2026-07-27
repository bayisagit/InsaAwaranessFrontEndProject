'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch, downloadCertificate, generateCertificatePdf } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { CardSkeleton } from '@/components/LoadingSkeleton';

interface Certificate {
    id: string;
    enrollment?: string;
    certificate_id?: string;
    issued_at?: string;
    pdf_file?: string | null;
}

export default function CertificatesPage() {
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const router = useRouter(); // Initialized useRouter
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoadingCertificates, setIsLoadingCertificates] = useState(true); // Renamed isLoading to isLoadingCertificates
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const pageSize = 8;

    useEffect(() => {
        if (!authLoading) { // Changed from !isLoading to !authLoading to match original context
            if (!isAuthenticated) {
                router.push('/login');
            } else {
                fetchCertificates();
            }
        }
    }, [isAuthenticated, authLoading, router, page, searchTerm]); // Added router, page, searchTerm to dependencies

    const fetchCertificates = async () => {
        setIsLoadingCertificates(true); // Changed to setIsLoadingCertificates
        setError(''); // Added setError('')
        const query = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
            search: searchTerm,
            ordering: '-issued_at'
        }).toString();

        const { data, error: apiError, status } = await apiFetch(`/api/v1/certificates/?${query}`); // Updated apiFetch call with query

        if (apiError || status !== 200) { // Added status check
            setError(apiError || 'Failed to fetch certificates');
        } else if (data?.results && Array.isArray(data.results)) {
            setCertificates(data.results);
            setTotalCount(data.count || 0); // Set totalCount
        } else if (Array.isArray(data)) {
            setCertificates(data);
            setTotalCount(data.length); // Set totalCount for non-paginated data
        }
        setIsLoadingCertificates(false); // Changed to setIsLoadingCertificates
    };

    const handleDownload = async (id: string) => {
        const { data, error: e } = await downloadCertificate(id);
        if (e || !data) { setError(e || 'Failed to download'); return; }
        const url = window.URL.createObjectURL(data as any);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleGeneratePdf = async (id: string) => {
        setActionLoading(id);
        const { error: e } = await generateCertificatePdf(id);
        if (e) setError(e);
        else fetchCertificates();
        setActionLoading(null);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    if (authLoading || isLoadingCertificates) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div aria-label="Loading" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted pb-20">
            <section className="bg-card border-b border-border">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-20 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">
                        My Certificates
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        View and download your earned cybersecurity certifications.
                    </p>
                    <div className="max-w-md mx-auto">
                        <Input
                            placeholder="Search certificates by ID..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
            </section>

            {isLoadingCertificates ? (
                <div className="max-w-5xl mx-auto px-6 lg:px-12 pt-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            ) : error ? (
                <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10">
                    <div role="alert" className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
                </div>
            ) : (
                <div className="max-w-5xl mx-auto px-6 lg:px-12 pt-10">
                    {certificates.length === 0 ? (
                        <EmptyState
                            icon={
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                            title="No Certificates Found"
                            description="Complete training modules to earn your cybersecurity certifications."
                        />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                {certificates.map(cert => (
                                    <div key={cert.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm shadow-black/5 dark:shadow-none hover:shadow-md shadow-black/10 dark:shadow-none transition-all group">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-foreground truncate">
                                                    Certificate ID: {cert.certificate_id?.split('-')[0].toUpperCase() || 'Cybersecurity Verification'}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    Issued to: <span className="font-medium text-foreground">{user?.first_name} {user?.last_name}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Issue Date</p>
                                                <p className="text-sm font-semibold text-foreground">{formatDate(cert.issued_at)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Certificate ID</p>
                                                <p className="text-sm font-mono text-muted-foreground truncate max-w-[120px]" title={cert.certificate_id}>{cert.certificate_id || '—'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex gap-2">
                                            {cert.pdf_file ? (
                                                <button
                                                    onClick={() => handleDownload(cert.id)}
                                                    disabled={actionLoading === cert.id}
                                                    className="flex-1 py-2.5 bg-muted text-foreground font-bold rounded-xl border border-border hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download PDF
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleGeneratePdf(cert.id)}
                                                    disabled={actionLoading === cert.id}
                                                    className="flex-1 py-2.5 bg-primary/10 text-primary font-bold rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {actionLoading === cert.id ? 'Generating...' : 'Generate PDF'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Pagination
                                page={page}
                                pageSize={pageSize}
                                totalCount={totalCount}
                                isLoading={isLoadingCertificates}
                                onPageChange={setPage}
                                label="certificates"
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
