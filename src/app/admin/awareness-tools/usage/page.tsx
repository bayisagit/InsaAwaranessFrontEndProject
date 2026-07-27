'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAwarenessToolUsages, AwarenessToolUsage } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import Link from 'next/link';

export default function AwarenessToolUsagePage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [usages, setUsages] = useState<AwarenessToolUsage[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (user?.role !== 'super_admin') router.push('/dashboard');
            else fetchUsages();
        }
    }, [isAuthenticated, isLoading, user, router, page, searchTerm]);

    const fetchUsages = async () => {
        setIsFetching(true);
        const params: Record<string, any> = {
            page: page.toString(),
            page_size: pageSize.toString()
        };
        if (searchTerm) params.search = searchTerm;
        const { data, error: e } = await getAwarenessToolUsages(params);
        if (e) setError(e);
        else if (data?.results) {
            setUsages(data.results);
            setTotalCount(data.count || 0);
        }
        setIsFetching(false);
    };

    if (isLoading || isFetching) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="min-h-screen bg-muted pb-20">
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Link href="/admin/awareness-tools" className="hover:text-primary">Awareness Tools</Link>
                            <span>&rarr;</span>
                            <span>Usage Logs</span>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">Tool Usage Monitoring</h1>
                        <p className="text-muted-foreground">Track and analyze how awareness tools are being utilized across the platform.</p>
                    </div>
                    <Button variant="outline" onClick={fetchUsages}>Refresh Logs</Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by tool name, user email, or action..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm shadow-black/5 dark:shadow-none">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted border-b border-border">
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">User Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Tool Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Metadata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {usages.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                                        No usage logs found.
                                    </td>
                                </tr>
                            ) : usages.map((usage) => (
                                <tr key={usage.id} className="hover:bg-muted transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-medium text-foreground">{new Date(usage.created_at).toLocaleDateString()}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(usage.created_at).toLocaleTimeString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-foreground">{usage.user_email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-foreground">{usage.tool_name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                            {usage.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-muted-foreground font-mono line-clamp-1 truncate max-w-xs" title={usage.metadata}>
                                            {usage.metadata}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalCount > pageSize && (
                    <div className="mt-6 flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                        <span className="text-sm text-muted-foreground">Showing {usages.length} of {totalCount} logs</span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || isFetching}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={(page * pageSize) >= totalCount || isFetching}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
