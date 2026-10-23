'use client';

import React, { useEffect, useState } from 'react';
import {
    X,
    Check,
    Copy,
    Shield,
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Activity,
    User,
    Bot,
    Layers,
    Globe,
    Laptop,
    KeyRound,
    Calendar,
    Clock,
    ArrowRight,
    FileText,
    Sparkles,
    Code,
    Terminal,
    LogIn,
    LogOut,
    Trash2,
    PlusCircle,
    Edit3,
    Lock,
    Award,
    BookOpen,
    Eye,
    Server,
    Hash,
    Cpu,
    Network
} from 'lucide-react';
import { getAuditLog } from '@/lib/api';
import type { AuditLog } from '@/lib/api';

interface AuditLogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    logId?: string | null;
    initialLog?: AuditLog | null;
}

export function AuditLogDetailModal({
    isOpen,
    onClose,
    logId,
    initialLog,
}: AuditLogDetailModalProps) {
    const [log, setLog] = useState<AuditLog | null>(initialLog || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'changes' | 'telemetry' | 'raw'>('overview');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setLog(null);
            setError(null);
            setActiveTab('overview');
            return;
        }

        if (initialLog) {
            setLog(initialLog);
        }

        const idToFetch = logId || initialLog?.id;
        if (idToFetch && (!initialLog || !initialLog.event_narrative)) {
            fetchDetail(idToFetch);
        }
    }, [isOpen, logId, initialLog]);

    const fetchDetail = async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: err } = await getAuditLog(id);
            if (err) {
                setError(err);
            } else if (data) {
                setLog(data);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to fetch audit log detail');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (!isOpen) return null;

    // Semantic configuration based on action & status
    const getActionTheme = (action: string = '') => {
        const act = action.toLowerCase();
        if (act.includes('delete') || act.includes('destroy')) {
            return {
                label: 'Delete Event',
                icon: Trash2,
                badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                headerGradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
                accentColor: 'text-rose-500',
            };
        }
        if (act.includes('create') || act.includes('enroll') || act.includes('register')) {
            return {
                label: 'Creation Event',
                icon: PlusCircle,
                badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                headerGradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
                accentColor: 'text-emerald-500',
            };
        }
        if (act.includes('login') || act.includes('auth')) {
            if (act.includes('fail')) {
                return {
                    label: 'Authentication Failed',
                    icon: ShieldAlert,
                    badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                    headerGradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
                    accentColor: 'text-rose-500',
                };
            }
            return {
                label: 'Authentication Event',
                icon: LogIn,
                badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                headerGradient: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
                accentColor: 'text-indigo-500',
            };
        }
        if (act.includes('logout')) {
            return {
                label: 'Session Termination',
                icon: LogOut,
                badgeBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
                headerGradient: 'from-slate-500/20 via-slate-500/5 to-transparent',
                accentColor: 'text-slate-500',
            };
        }
        if (act.includes('password') || act.includes('verify')) {
            return {
                label: 'Security Credential Event',
                icon: KeyRound,
                badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                headerGradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
                accentColor: 'text-amber-500',
            };
        }
        if (act.includes('certificate')) {
            return {
                label: 'Certificate Event',
                icon: Award,
                badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                headerGradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
                accentColor: 'text-purple-500',
            };
        }
        return {
            label: 'Modification Event',
            icon: Edit3,
            badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            headerGradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
            accentColor: 'text-blue-500',
        };
    };

    const actionTheme = getActionTheme(log?.action);
    const ActionIcon = actionTheme.icon;

    const changesEntries = log?.changes ? Object.entries(log.changes) : [];

    const formatDiffValue = (val: any) => {
        if (val === null || val === undefined) {
            return <span className="italic opacity-60">None</span>;
        }
        if (typeof val === 'boolean') {
            return val ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">true</span>
            ) : (
                <span className="font-semibold text-rose-600 dark:text-rose-400">false</span>
            );
        }
        if (typeof val === 'object') {
            return (
                <pre className="text-[11px] font-mono whitespace-pre-wrap break-all p-2 bg-muted/60 rounded border border-border/50 max-h-36 overflow-y-auto">
                    {JSON.stringify(val, null, 2)}
                </pre>
            );
        }
        return <span className="break-all">{String(val)}</span>;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-foreground animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ═══════════════════════════════════════════════════════
                    1. MODAL TOP HEADER
                   ═══════════════════════════════════════════════════════ */}
                <div className={`relative px-6 py-5 border-b border-border bg-gradient-to-r ${actionTheme.headerGradient} flex items-start justify-between gap-4 shrink-0`}>
                    <div className="flex items-start gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border/50 bg-card`}>
                            <ActionIcon className={`size-6 ${actionTheme.accentColor}`} />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${actionTheme.badgeBg}`}>
                                    {log?.action || 'EVENT'}
                                </span>

                                {log?.status === 'success' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <CheckCircle2 className="size-3.5" />
                                        Success
                                    </span>
                                )}
                                {log?.status === 'warning' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        <AlertTriangle className="size-3.5" />
                                        Warning
                                    </span>
                                )}
                                {log?.status === 'error' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                        <XCircle className="size-3.5" />
                                        Failed
                                    </span>
                                )}

                                {log?.category_display && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                                        {log.category_display}
                                    </span>
                                )}
                            </div>

                            <h2 className="text-lg font-bold text-foreground truncate flex items-center gap-2">
                                <span>Audit Event Details</span>
                                {log?.id && (
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(log.id, 'id')}
                                        className="text-xs font-mono font-normal text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-muted/80 transition-colors cursor-pointer"
                                        title="Click to copy Audit Event UUID"
                                    >
                                        <Hash className="size-3 text-muted-foreground" />
                                        <span>{log.id.substring(0, 8)}...</span>
                                        {copiedKey === 'id' ? (
                                            <Check className="size-3 text-emerald-500" />
                                        ) : (
                                            <Copy className="size-3 opacity-60" />
                                        )}
                                    </button>
                                )}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 cursor-pointer"
                        title="Close modal"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════════════
                    2. EXECUTIVE NARRATIVE CALLOUT ("What Happened")
                   ═══════════════════════════════════════════════════════ */}
                {log && (
                    <div className="px-6 pt-4 pb-3 bg-muted/40 border-b border-border flex items-start gap-3">
                        <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                            <div className="font-bold text-foreground text-sm">
                                {log.event_narrative || log.effective_description || log.description || 'System Audit Event Recorded'}
                            </div>
                            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                                {log.created_at_formatted && (
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="size-3.5 text-muted-foreground" />
                                        {log.created_at_formatted}
                                    </span>
                                )}
                                {log.time_ago && (
                                    <span className="flex items-center gap-1.5 font-medium text-primary">
                                        <Clock className="size-3.5" />
                                        {log.time_ago}
                                    </span>
                                )}
                                {log.location && log.location !== 'Unknown Location' && (
                                    <span className="flex items-center gap-1.5">
                                        <Globe className="size-3.5 text-muted-foreground" />
                                        {log.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════
                    3. NAVIGATION TABS
                   ═══════════════════════════════════════════════════════ */}
                <div className="flex border-b border-border px-6 gap-2 bg-card shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'overview'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Activity className="size-3.5" />
                        Overview & Entities
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('changes')}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'changes'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Edit3 className="size-3.5" />
                        <span>What Changed (Diff)</span>
                        {changesEntries.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                {changesEntries.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('telemetry')}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'telemetry'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Network className="size-3.5" />
                        Security & Network
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('raw')}
                        className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'raw'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Code className="size-3.5" />
                        Raw JSON & Diagnostics
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════════════
                    4. CONTENT BODY
                   ═══════════════════════════════════════════════════════ */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading && !log && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="text-xs text-muted-foreground">Loading full audit log details...</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-3">
                            <AlertTriangle className="size-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {log && (
                        <>
                            {/* ═════════════════════════════════════════════════
                                TAB 1: OVERVIEW & ENTITIES
                               ═════════════════════════════════════════════════ */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Actor Card */}
                                        <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                    <User className="size-3.5 text-primary" />
                                                    Actor (Initiator)
                                                </div>
                                                {log.actor_role && (
                                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                        {log.actor_role}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 pt-1">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                                                    {log.actor ? (
                                                        log.actor_name ? log.actor_name.charAt(0).toUpperCase() : 'U'
                                                    ) : (
                                                        <Bot className="size-5 text-indigo-500" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1 space-y-0.5">
                                                    <div className="text-sm font-semibold text-foreground truncate">
                                                        {log.actor_name || 'System Automation'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {log.actor_email || (log.actor ? 'No email linked' : 'Internal Django Automated Process')}
                                                    </div>
                                                </div>
                                            </div>

                                            {log.actor && (
                                                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground font-mono">
                                                    <span>Actor ID:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(log.actor!, 'actor_id')}
                                                        className="hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer"
                                                    >
                                                        <span>{log.actor.substring(0, 12)}...</span>
                                                        {copiedKey === 'actor_id' ? (
                                                            <Check className="size-3 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="size-3 opacity-60" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Target Entity / Target User Card */}
                                        <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                    <Layers className="size-3.5 text-primary" />
                                                    Target Subject / Object
                                                </div>
                                                {log.model && (
                                                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-foreground border border-border">
                                                        {log.model}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2 pt-1">
                                                {log.target_object_repr ? (
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {log.target_object_repr}
                                                    </div>
                                                ) : log.target_user_name ? (
                                                    <div className="space-y-0.5">
                                                        <div className="text-sm font-semibold text-foreground">
                                                            {log.target_user_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {log.target_user_email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {log.model ? `${log.app_label} / ${log.model}` : 'Global System Operation'}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                                    <div className="p-2 bg-card rounded-lg border border-border/60">
                                                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">App Scope</div>
                                                        <div className="font-mono text-foreground font-medium truncate">{log.app_label || '—'}</div>
                                                    </div>
                                                    <div className="p-2 bg-card rounded-lg border border-border/60">
                                                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Model Class</div>
                                                        <div className="font-mono text-foreground font-medium truncate">{log.model || '—'}</div>
                                                    </div>
                                                </div>

                                                {log.object_id && (
                                                    <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground font-mono">
                                                        <span>Object ID:</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(log.object_id, 'object_id')}
                                                            className="hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer"
                                                        >
                                                            <span>{log.object_id.substring(0, 16)}...</span>
                                                            {copiedKey === 'object_id' ? (
                                                                <Check className="size-3 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="size-3 opacity-60" />
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operational Context Summary Table */}
                                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                        <div className="px-4 py-3 bg-muted/30 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Server className="size-3.5 text-primary" />
                                            Operation Context Summary
                                        </div>
                                        <div className="divide-y divide-border text-xs">
                                            <div className="grid grid-cols-3 px-4 py-2.5">
                                                <span className="text-muted-foreground font-medium">Action Key</span>
                                                <span className="col-span-2 font-mono font-semibold text-foreground uppercase">{log.action}</span>
                                            </div>
                                            <div className="grid grid-cols-3 px-4 py-2.5">
                                                <span className="text-muted-foreground font-medium">Category</span>
                                                <span className="col-span-2 font-medium text-foreground">{log.category_display || log.category}</span>
                                            </div>
                                            <div className="grid grid-cols-3 px-4 py-2.5">
                                                <span className="text-muted-foreground font-medium">Outcome Status</span>
                                                <span className="col-span-2 font-semibold capitalize text-foreground">{log.status}</span>
                                            </div>
                                            <div className="grid grid-cols-3 px-4 py-2.5">
                                                <span className="text-muted-foreground font-medium">Recorded At</span>
                                                <span className="col-span-2 font-mono text-foreground">
                                                    {new Date(log.created_at).toUTCString()} ({log.time_ago || 'recent'})
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 px-4 py-2.5">
                                                <span className="text-muted-foreground font-medium">Narrative Summary</span>
                                                <span className="col-span-2 text-foreground font-medium">
                                                    {log.description || log.effective_description || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════
                                TAB 2: WHAT CHANGED (DIFF INSPECTOR)
                               ═════════════════════════════════════════════════ */}
                            {activeTab === 'changes' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Edit3 className="size-3.5 text-primary" />
                                            Attribute Modifications & Dirty Tracking
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {changesEntries.length} field{changesEntries.length === 1 ? '' : 's'} recorded
                                        </span>
                                    </div>

                                    {changesEntries.length === 0 ? (
                                        <div className="p-12 text-center border border-dashed border-border rounded-2xl space-y-2">
                                            <Sparkles className="size-8 text-muted-foreground mx-auto opacity-50" />
                                            <div className="text-sm font-semibold text-foreground">No Field-Level Delta Recorded</div>
                                            <div className="text-xs text-muted-foreground max-w-md mx-auto">
                                                This event was logged as an action-based checkpoint (such as a session login, logout, verification, or hard deletion) where specific before/after column differences were not captured.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {changesEntries.map(([field, delta]) => {
                                                // Check if delta is an array [oldVal, newVal]
                                                const isArrayDiff = Array.isArray(delta) && delta.length === 2;
                                                const isObjectDiff = !isArrayDiff && delta && typeof delta === 'object' && ('old' in delta || 'new' in delta || 'from' in delta || 'to' in delta);

                                                let oldVal = null;
                                                let newVal = null;

                                                if (isArrayDiff) {
                                                    oldVal = delta[0];
                                                    newVal = delta[1];
                                                } else if (isObjectDiff) {
                                                    oldVal = delta.old ?? delta.from ?? null;
                                                    newVal = delta.new ?? delta.to ?? null;
                                                }

                                                return (
                                                    <div key={field} className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded bg-muted border border-border">
                                                                    {field}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground">modified</span>
                                                            </div>
                                                        </div>

                                                        {isArrayDiff || isObjectDiff ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                                {/* Before / Old Value */}
                                                                <div className="p-3 bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 rounded-xl space-y-1">
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                                        <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black leading-none">
                                                                            -
                                                                        </span>
                                                                        Previous State (Before)
                                                                    </div>
                                                                    <div className="text-xs text-foreground font-mono">
                                                                        {formatDiffValue(oldVal)}
                                                                    </div>
                                                                </div>

                                                                {/* After / New Value */}
                                                                <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black leading-none">
                                                                            +
                                                                        </span>
                                                                        Updated State (After)
                                                                    </div>
                                                                    <div className="text-xs text-foreground font-mono">
                                                                        {formatDiffValue(newVal)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                                                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                    Assigned Value
                                                                </div>
                                                                <div className="text-xs text-foreground font-mono">
                                                                    {formatDiffValue(delta)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════
                                TAB 3: SECURITY & TELEMETRY
                               ═════════════════════════════════════════════════ */}
                            {activeTab === 'telemetry' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* IP Address Card */}
                                        <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                    <Globe className="size-3.5 text-primary" />
                                                    Client IP Address
                                                </div>
                                                {log.ip_address && (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                                                        {log.ip_address.startsWith('127.') || log.ip_address === '::1' || log.ip_address.startsWith('192.168.') || log.ip_address.startsWith('10.')
                                                            ? 'Private / Local Network'
                                                            : 'Public IPv4 / IPv6'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-base font-mono font-bold text-foreground">
                                                    {log.ip_address || 'Not Recorded'}
                                                </span>

                                                {log.ip_address && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(log.ip_address!, 'ip')}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        {copiedKey === 'ip' ? (
                                                            <>
                                                                <Check className="size-3 text-emerald-500" />
                                                                <span>Copied</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="size-3 text-muted-foreground" />
                                                                <span>Copy IP</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Geolocation Card */}
                                        <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2">
                                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <Globe className="size-3.5 text-primary" />
                                                Approximate Geolocation
                                            </div>

                                            <div className="pt-1">
                                                <div className="text-base font-semibold text-foreground">
                                                    {log.location || 'Unknown Location'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Resolved from request headers & MaxMind/IP registry
                                                </div>
                                            </div>
                                        </div>

                                        {/* Device & Client Info */}
                                        <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2 sm:col-span-2">
                                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <Laptop className="size-3.5 text-primary" />
                                                Client Device & Browser Identity
                                            </div>

                                            <div className="pt-1">
                                                <div className="text-sm font-semibold text-foreground">
                                                    {log.device_info || 'Unidentified Client Device'}
                                                </div>
                                            </div>

                                            {log.user_agent && (
                                                <div className="pt-2 space-y-1">
                                                    <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                                                        <span>HTTP User-Agent Header</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(log.user_agent!, 'ua')}
                                                            className="hover:text-foreground inline-flex items-center gap-1 cursor-pointer font-normal"
                                                        >
                                                            {copiedKey === 'ua' ? (
                                                                <span className="text-emerald-500 font-bold">Copied</span>
                                                            ) : (
                                                                <>
                                                                    <Copy className="size-3" />
                                                                    <span>Copy UA</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="p-3 bg-card border border-border rounded-xl font-mono text-xs text-muted-foreground break-all select-all">
                                                        {log.user_agent}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═════════════════════════════════════════════════
                                TAB 4: RAW JSON & DIAGNOSTICS
                               ═════════════════════════════════════════════════ */}
                            {activeTab === 'raw' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Code className="size-3.5 text-primary" />
                                            Complete Raw Audit Log Payload
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleCopy(JSON.stringify(log, null, 2), 'raw_json')}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            {copiedKey === 'raw_json' ? (
                                                <>
                                                    <Check className="size-3.5 text-emerald-500" />
                                                    <span>Copied Full Payload</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3.5" />
                                                    <span>Copy All JSON</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                        <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2">
                                            <div className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                                <Terminal className="size-3.5 text-primary" />
                                                Custom Context Metadata
                                            </div>
                                            <pre className="text-xs font-mono p-3 bg-card rounded-xl border border-border overflow-x-auto text-foreground">
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <pre className="text-xs font-mono p-4 bg-card rounded-2xl border border-border overflow-x-auto text-foreground max-h-96 overflow-y-auto leading-relaxed">
                                            {JSON.stringify(log, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ═══════════════════════════════════════════════════════
                    5. FOOTER ACTIONS
                   ═════════════════════════════════════════════════ */}
                <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-muted-foreground">
                        {log ? `Event Log ID: ${log.id}` : ''}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
