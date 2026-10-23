'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAuditLogs } from '@/lib/api';
import type { AuditLog } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import { Bot, Eye, CheckCircle2, AlertTriangle, XCircle, Search, RefreshCw, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/Button';
import { AuditLogDetailModal } from '@/components/admin/AuditLogDetailModal';

export default function AuditLogsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [appFilter, setAppFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
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
    }, [isAuthenticated, isLoading, user, router, page, searchTerm, actionFilter, appFilter, statusFilter]);

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
        if (statusFilter) params.status = statusFilter;

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
            create: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            update: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            delete: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
            login: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            failed_login: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
            password_reset: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
        return styles[action] || 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    };

    if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!user || user.role !== 'super_admin') return null;

    const hasActiveFilters = Boolean(searchTerm || statusFilter || actionFilter || appFilter);

    return (
        <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-sm">
                        <Activity className="size-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Audit Logs</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground border border-border">
                                {totalCount} {totalCount === 1 ? 'event' : 'events'}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Comprehensive security telemetry, actor attribution, dirty tracking, and chronological activity monitoring.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Button
                        onClick={fetchLogs}
                        variant="outline"
                        size="sm"
                        disabled={isFetching}
                        className="cursor-pointer"
                    >
                        <RefreshCw className={`size-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-card p-3 sm:p-4 rounded-2xl border border-border shadow-sm shadow-black/5 dark:shadow-none flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search actor, model, IP, UUID, action..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer"
                    >
                        <option value="">All Outcomes</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Failed / Error</option>
                    </select>

                    <select
                        value={actionFilter}
                        onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                        className="px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer"
                    >
                        <option value="">All Actions</option>
                        <option value="create">Create</option>
                        <option value="update">Update</option>
                        <option value="delete">Delete</option>
                        <option value="login">Login</option>
                        <option value="failed_login">Failed Login</option>
                        <option value="password_reset">Password Reset</option>
                    </select>

                    <select
                        value={appFilter}
                        onChange={(e) => { setAppFilter(e.target.value); setPage(1); }}
                        className="px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer"
                    >
                        <option value="">All Apps</option>
                        <option value="accounts">Accounts</option>
                        <option value="courses">Courses</option>
                        <option value="assessment">Assessments</option>
                        <option value="organizations">Organizations</option>
                        <option value="alerts">Alerts</option>
                        <option value="resources">Resources</option>
                        <option value="campaigns">Campaigns</option>
                        <option value="awareness_tools">Awareness Tools</option>
                    </select>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('');
                                setActionFilter('');
                                setAppFilter('');
                                setPage(1);
                            }}
                            className="px-3 py-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="relative">
                {isFetching && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/40 z-10 flex items-start justify-center pt-16 rounded-2xl backdrop-blur-[1px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}

                <div className="bg-card rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm text-muted-foreground min-w-[1000px]">
                            <thead className="bg-muted text-foreground uppercase font-bold text-xs border-b border-border">
                                <tr>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Timestamp</th>
                                    <th className="px-5 py-3.5">Actor</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Action</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5">Target / Subject</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Modifications</th>
                                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Inspect</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground text-xs sm:text-sm">
                                            No audit logs match your search filters.
                                        </td>
                                    </tr>
                                ) : logs.map(log => {
                                    const changesCount = log.changes ? Object.keys(log.changes).length : 0;
                                    return (
                                        <tr
                                            key={log.id}
                                            onClick={() => {
                                                setSelectedLog(log);
                                                setIsDetailOpen(true);
                                            }}
                                            className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                            title="Click anywhere to open full audit log details"
                                        >
                                            <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground">
                                                <div className="font-medium text-foreground">{formatDate(log.created_at)}</div>
                                                {log.time_ago && (
                                                    <div className="text-[11px] text-muted-foreground font-mono">{log.time_ago}</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 font-medium text-foreground">
                                                {log.actor_email ? (
                                                    <div className="space-y-0.5">
                                                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]" title={log.actor_name || log.actor_email}>
                                                            {log.actor_name || log.actor_email}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]" title={log.actor_email}>
                                                            {log.actor_email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                                        <Bot className="w-3.5 h-3.5" />
                                                        System Process
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${actionBadge(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {log.status === 'success' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle2 className="size-3" />
                                                        Success
                                                    </span>
                                                )}
                                                {log.status === 'warning' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                        <AlertTriangle className="size-3" />
                                                        Warning
                                                    </span>
                                                )}
                                                {log.status === 'error' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                        <XCircle className="size-3" />
                                                        Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {log.target_object_repr ? (
                                                    <div className="text-xs font-semibold text-foreground truncate max-w-[240px]" title={log.target_object_repr}>
                                                        {log.target_object_repr}
                                                    </div>
                                                ) : log.model ? (
                                                    <div>
                                                        <span className="text-xs font-mono text-muted-foreground">{log.app_label}</span>
                                                        <span className="mx-1 text-muted-foreground">/</span>
                                                        <span className="text-xs font-mono font-semibold text-foreground">{log.model}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">System global</span>
                                                )}
                                                {log.object_id && (
                                                    <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[160px]" title={log.object_id}>
                                                        {log.object_id}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                                                {changesCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-[11px] font-semibold border border-border">
                                                        {changesCount} field{changesCount === 1 ? '' : 's'}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/60">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedLog(log);
                                                        setIsDetailOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground border border-primary/20 transition-all cursor-pointer shadow-sm"
                                                >
                                                    <Eye className="size-3.5" />
                                                    <span>Inspect</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalCount > pageSize && (
                    <div className="mt-6">
                        <Pagination page={page} pageSize={pageSize} totalCount={totalCount} isLoading={isFetching} onPageChange={setPage} label="audit logs" />
                    </div>
                )}
            </div>

            {/* Audit Log Deep Inspection Modal */}
            <AuditLogDetailModal
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedLog(null);
                }}
                initialLog={selectedLog}
                logId={selectedLog?.id}
            />
        </div>
    );
}
