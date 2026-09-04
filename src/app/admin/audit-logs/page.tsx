'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAuditLogs } from '@/lib/api';
import type { AuditLog } from '@/lib/api';
import { Input } from '@/components/Input';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';

export default function AuditLogsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [appFilter, setAppFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 15;
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
                return;
            }
            if (user?.role !== 'super_admin') {
                router.push('/dashboard');
                return;
            }
            
            const timer = setTimeout(() => {
                fetchLogs();
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isLoading, user, router, page, searchTerm, actionFilter, appFilter]);

    const fetchLogs = async () => {
        setIsFetching(true);
        setError('');
        const params: Record<string, any> = {
            page: page.toString(),
            page_size: pageSize.toString(),
            ordering: '-created_at',
        };
        if (searchTerm) params.search = searchTerm;
        if (actionFilter) params.action = actionFilter;
        if (appFilter) params.app_label = appFilter;

        const { data, error: e } = await getAuditLogs(params);
        if (e) setError(e);
        else if (data) {
            setLogs(data.results);
            setTotalCount(data.count);
        }
        setIsFetching(false);
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        } catch {
            return dateStr;
        }
    };

    const actionBadge = (action: string) => {
        const styles: Record<string, string> = {
            create: 'bg-green-50 text-green-700',
            update: 'bg-blue-50 text-blue-700',
            delete: 'bg-red-50 text-red-700',
        };
        return styles[action] || 'bg-muted/50 text-foreground';
    };

    if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!user || user.role !== 'super_admin') return null;

    return (
        <div className="min-h-screen bg-muted pb-20">
            <PageHeader
                title="Audit Logs"
                description="Monitor system activity and security events."
                actions={
                    <div className="flex gap-3 flex-wrap">
                        <div className="w-48">
                            <Input
                                placeholder="Search model, object, email..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            />
                        </div>
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="rounded-lg border border-border py-2 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
                        >
                            <option value="">All actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                        </select>
                        <select
                            value={appFilter}
                            onChange={(e) => { setAppFilter(e.target.value); setPage(1); }}
                            className="rounded-lg border border-border py-2 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
                        >
                            <option value="">All apps</option>
                            <option value="accounts">Accounts</option>
                            <option value="courses">Courses</option>
                            <option value="organizations">Organizations</option>
                            <option value="alerts">Alerts</option>
                            <option value="resources">Resources</option>
                            <option value="campaigns">Campaigns</option>
                        </select>
                    </div>
                }
            />
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}
                <div className="relative">
                    {isFetching && (
                        <div className="absolute inset-0 bg-white/60 z-10 flex items-start justify-center pt-16 rounded-xl">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}
                    <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                        <table className="w-full text-left text-sm text-muted-foreground">
                            <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Actor</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">App / Model</th>
                                    <th className="px-6 py-4">Object ID</th>
                                    <th className="px-6 py-4">Changes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No audit logs found.</td></tr>
                                ) : logs.map(log => (
                                    <tr key={log.id} className="hover:bg-muted transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {log.actor_email || <span className="text-muted-foreground italic">system</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${actionBadge(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono text-muted-foreground">{log.app_label}</span>
                                            <span className="mx-1 text-gray-300">/</span>
                                            <span className="text-xs font-mono">{log.model}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-muted-foreground max-w-[120px] truncate" title={log.object_id}>
                                            {log.object_id}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground max-w-[200px] truncate" title={JSON.stringify(log.changes)}>
                                            {Object.keys(log.changes).length > 0
                                                ? Object.entries(log.changes).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalCount > pageSize && (
                        <div className="mt-6">
                            <Pagination page={page} pageSize={pageSize} totalCount={totalCount} isLoading={isFetching} onPageChange={setPage} label="audit logs" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
