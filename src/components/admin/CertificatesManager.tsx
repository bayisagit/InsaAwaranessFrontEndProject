'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getCertificates, type Certificate } from '@/lib/api';
import { Award, Search, Download, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CertificatesManagerProps {
    lockedCourseId?: string;
}

export function CertificatesManager({ lockedCourseId }: CertificatesManagerProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    
    // Pagination & Search
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCertificates = useCallback(async () => {
        setIsFetching(true); setError('');
        
        const params: Record<string, any> = {
            page,
            page_size: pageSize,
            search: searchTerm
        };
        
        if (lockedCourseId) {
            params.course = lockedCourseId; // Assuming backend supports filtering certificates by course
        }
        
        const { data, error: e } = await getCertificates(params);
        if (e) {
            setError(e);
        } else if (data?.results) {
            setCertificates(data.results);
            setTotalCount(data.count || 0);
        } else if (Array.isArray(data)) {
            setCertificates(data);
            setTotalCount(data.length);
        }
        
        setIsFetching(false);
    }, [page, pageSize, searchTerm, lockedCourseId]);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else fetchCertificates();
        }
    }, [isAuthenticated, isLoading, router, fetchCertificates]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchCertificates();
    };

    if (isLoading) return null;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Issued Certificates</h2>
                    <p className="text-sm text-muted-foreground">View and manage certificates awarded to learners.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted p-3 rounded-xl border border-border">
                <form onSubmit={handleSearch} className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                    <input
                        type="text"
                        placeholder="Search by ID or Learner..."
                        className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-primary focus:border-primary focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>}

            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Certificate ID</th>
                                <th className="px-6 py-4">Issued At</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-muted-foreground">
                            {isFetching ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Loading certificates...
                                        </div>
                                    </td>
                                </tr>
                            ) : certificates.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Award className="size-12 mb-3 text-gray-300" />
                                            <p className="text-base font-medium text-foreground mb-1">No certificates found</p>
                                            <p className="text-sm">No certificates have been issued yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : certificates.map(cert => (
                                <tr key={cert.id} className="hover:bg-muted transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium text-foreground">{cert.certificate_id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                            <Clock className="size-3" />
                                            {new Date(cert.issued_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700">
                                            <CheckCircle className="size-3" /> Valid
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {cert.pdf_file ? (
                                            <a href={cert.pdf_file} target="_blank" rel="noreferrer">
                                                <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10">
                                                    <Download className="size-4 mr-2" /> Download PDF
                                                </Button>
                                            </a>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No PDF</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalCount > pageSize && (
                    <div className="px-6 py-4 border-t border-border flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-medium text-foreground">{totalCount}</span> certificates
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">Prev</button>
                            <button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalCount} className="px-3 py-1 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
