'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
    RotateCcw,
    X,
    Eye,
    Clock,
    Calendar,
    ArrowRight,
    GraduationCap,
    Folder,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    AlertTriangle,
    Layers,
    User,
    Shield,
    Activity,
    Info,
    Check,
    Copy,
    Building,
    FileText
} from 'lucide-react';
import { Button } from '@/components/Button';
import { AuditLogDetailModal } from './AuditLogDetailModal';

export interface TrashItemDetailData {
    id: string;
    model: string;
    name: string;
    deleted_at: string;
    deleted_session_id: string | null;
    created_at?: string;
    updated_at?: string;
    ancestry: Array<{
        level: string;
        model: string;
        id: string;
        title: string;
        is_deleted: boolean;
    }>;
    attributes: Record<string, any>;
    children_type?: string;
    children?: Array<{
        id: string;
        title: string;
        badge?: string;
        badge_type?: 'primary' | 'success' | 'warning' | 'neutral';
        is_deleted?: boolean;
    }>;
    cascade_items?: Array<{
        id: string;
        model: string;
        name: string;
        deleted_at: string;
    }>;
    cascade_count?: number;
    audit_trail?: Array<{
        id: string;
        action: string;
        category?: string;
        status?: string;
        actor_name?: string;
        actor_email?: string;
        created_at: string;
        ip_address?: string;
        location?: string;
        device_info?: string;
        description?: string;
        changes?: Record<string, any>;
    }>;
}

interface TrashItemDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    model: string | null;
    itemId: string | null;
    onRestore: (item: { id: string; model: string; name: string }) => void;
    isRestoring?: boolean;
}

const MODEL_COLOR_MAP: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    course: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', icon: GraduationCap },
    module: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', icon: Folder },
    lesson: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/20', icon: BookOpen },
    assessment: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', icon: HelpCircle },
    question: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', icon: HelpCircle },
    choice: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20', icon: CheckCircle2 },
    user: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', icon: User },
    organization: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', icon: Building },
    compliancereport: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', icon: FileText },
    awarenesstool: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', icon: Shield },
};

export function TrashItemDetailModal({
    isOpen,
    onClose,
    model,
    itemId,
    onRestore,
    isRestoring = false
}: TrashItemDetailModalProps) {
    const [detail, setDetail] = useState<TrashItemDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'cascades' | 'audit'>('overview');
    const [copiedId, setCopiedId] = useState(false);
    const [selectedAuditLogId, setSelectedAuditLogId] = useState<string | null>(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen && model && itemId) {
            fetchDetail();
        } else {
            setDetail(null);
            setError(null);
            setActiveTab('overview');
        }
    }, [isOpen, model, itemId]);

    const fetchDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const url = `/api/v1/superadmin/trash/item_detail/?model=${encodeURIComponent(model!)}&id=${encodeURIComponent(itemId!)}`;
            const res = await apiFetch(url);
            if (res.error) {
                setError(res.error);
            } else {
                setDetail(res.data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch details');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const modelConfig = (model && MODEL_COLOR_MAP[model.toLowerCase()]) || {
        bg: 'bg-gray-500/10',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-500/20',
        icon: Layers
    };
    const ModelIcon = modelConfig.icon;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4">
            <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* 1. Header */}
                <div className="p-5 sm:p-6 border-b border-border bg-muted/20 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`p-3 rounded-xl border ${modelConfig.bg} ${modelConfig.border} ${modelConfig.text} shrink-0 shadow-sm`}>
                            <ModelIcon className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${modelConfig.bg} ${modelConfig.text} ${modelConfig.border}`}>
                                    {model || 'Record'}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    <Clock className="size-3" /> Soft-Deleted
                                </span>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-foreground truncate" title={detail?.name || 'Deleted Record Details'}>
                                {isLoading ? 'Loading item details...' : detail?.name || 'Deleted Record'}
                            </h2>
                            {itemId && (
                                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground font-mono">
                                    <span className="truncate max-w-xs">{itemId}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(itemId)}
                                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                                        title="Copy UUID"
                                    >
                                        {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {detail && (
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => onRestore({ id: detail.id, model: detail.model, name: detail.name })}
                                disabled={isRestoring}
                                className="shadow-sm"
                            >
                                <RotateCcw className={`size-3.5 mr-1.5 ${isRestoring ? 'animate-spin' : ''}`} />
                                {isRestoring ? 'Restoring...' : 'Restore Record'}
                            </Button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* 2. Content Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                    {isLoading ? (
                        <div className="py-16 text-center space-y-3">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm text-muted-foreground font-medium">Inspecting deleted record ancestry and history...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3">
                            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold">Unable to load details</div>
                                <div className="text-xs mt-0.5">{error}</div>
                            </div>
                        </div>
                    ) : detail ? (
                        <>
                            {/* ══════════════════════════════════════════════
                                A. ANCESTRY / HIERARCHY CHAIN BANNER
                               ("From What It Was Deleted")
                               ══════════════════════════════════════════════ */}
                            {detail.ancestry && detail.ancestry.length > 0 && (
                                <div className="bg-muted/30 border border-border rounded-2xl p-4 sm:p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Layers className="size-3.5 text-primary" />
                                            Origin Hierarchy & Parent Context
                                        </div>
                                        <span className="text-[11px] text-muted-foreground">
                                            Where this item lived before deletion
                                        </span>
                                    </div>

                                    {/* Breadcrumb Steps */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        {detail.ancestry.map((anc, idx) => {
                                            const AncIcon = MODEL_COLOR_MAP[anc.level.toLowerCase()]?.icon || Layers;
                                            return (
                                                <React.Fragment key={anc.id || idx}>
                                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium shadow-sm transition-all ${
                                                        anc.is_deleted
                                                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                                            : 'bg-card border-border text-foreground'
                                                    }`}>
                                                        <AncIcon className={`size-4 shrink-0 ${anc.is_deleted ? 'text-rose-500' : 'text-primary'}`} />
                                                        <div>
                                                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none">
                                                                {anc.level}
                                                            </div>
                                                            <div className="font-semibold text-xs truncate max-w-[180px] sm:max-w-[220px]" title={anc.title}>
                                                                {anc.title}
                                                            </div>
                                                        </div>
                                                        {anc.is_deleted ? (
                                                            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-rose-500 text-white rounded font-bold">
                                                                Deleted
                                                            </span>
                                                        ) : (
                                                            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded font-semibold">
                                                                Active
                                                            </span>
                                                        )}
                                                    </div>

                                                    {idx < detail.ancestry.length - 1 && (
                                                        <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}

                                        <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />

                                        {/* Current Item Node */}
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary text-xs font-bold shadow-sm`}>
                                            <ModelIcon className="size-4 shrink-0" />
                                            <div>
                                                <div className="text-[10px] uppercase font-bold tracking-wider leading-none opacity-80">
                                                    Current {model}
                                                </div>
                                                <div className="truncate max-w-[180px]" title={detail.name}>
                                                    {detail.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════
                                B. TABS NAVIGATION
                               ══════════════════════════════════════════════ */}
                            <div className="flex border-b border-border gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                                        activeTab === 'overview'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Overview & Attributes
                                </button>

                                {detail.children && detail.children.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('content')}
                                        className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                                            activeTab === 'content'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <span>{detail.children_type || 'Sub-items'}</span>
                                        <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[10px] rounded-full">
                                            {detail.children.length}
                                        </span>
                                    </button>
                                )}

                                {detail.cascade_items && detail.cascade_items.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('cascades')}
                                        className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                                            activeTab === 'cascades'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <span>Co-Deleted Cascades</span>
                                        <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-600 text-[10px] rounded-full font-bold">
                                            {detail.cascade_items.length}
                                        </span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('audit')}
                                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                                        activeTab === 'audit'
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <span>Audit History</span>
                                    {detail.audit_trail && detail.audit_trail.length > 0 && (
                                        <span className="px-1.5 py-0.2 bg-muted text-muted-foreground text-[10px] rounded-full">
                                            {detail.audit_trail.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* ══════════════════════════════════════════════
                                TAB 1: OVERVIEW & ATTRIBUTES
                               ══════════════════════════════════════════════ */}
                            {activeTab === 'overview' && (
                                <div className="space-y-5">
                                    {/* Timing Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="p-3.5 bg-muted/20 border border-border rounded-xl">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                <Clock className="size-3 text-rose-500" /> Deleted At
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-foreground">
                                                {new Date(detail.deleted_at).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="p-3.5 bg-muted/20 border border-border rounded-xl">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                <Calendar className="size-3 text-primary" /> Created At
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-foreground">
                                                {detail.created_at ? new Date(detail.created_at).toLocaleString() : 'N/A'}
                                            </div>
                                        </div>

                                        <div className="p-3.5 bg-muted/20 border border-border rounded-xl">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                <Layers className="size-3 text-blue-500" /> Session ID
                                            </div>
                                            <div className="mt-1 text-xs font-mono font-medium text-foreground truncate" title={detail.deleted_session_id || 'None'}>
                                                {detail.deleted_session_id ? detail.deleted_session_id.substring(0, 18) + '...' : 'Standalone Deletion'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Attributes Grid */}
                                    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3">
                                        <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                                            Object Properties & Metadata
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {Object.entries(detail.attributes).map(([key, val]) => {
                                                if (['name', 'id', 'deleted_at', 'created_at', 'updated_at'].includes(key)) return null;
                                                return (
                                                    <div key={key} className="p-3 bg-muted/30 border border-border rounded-xl space-y-1 min-w-0 overflow-hidden">
                                                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                                                            {key.replace(/_/g, ' ')}
                                                        </div>
                                                        <div className="text-xs font-medium text-foreground break-words line-clamp-3" title={String(val)}>
                                                            {typeof val === 'boolean' ? (
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${val ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                                                    {val ? 'TRUE' : 'FALSE'}
                                                                </span>
                                                            ) : typeof val === 'object' ? (
                                                                JSON.stringify(val)
                                                            ) : (
                                                                String(val) || '—'
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════
                                TAB 2: CONTENT & SUB-ITEMS
                               ══════════════════════════════════════════════ */}
                            {activeTab === 'content' && detail.children && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-bold text-foreground">
                                            {detail.children_type || 'Associated Child Items'}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {detail.children.length} items recorded
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {detail.children.map((child, idx) => (
                                            <div key={child.id || idx} className="p-3 bg-card border border-border rounded-xl flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="w-6 h-6 rounded-lg bg-muted text-muted-foreground font-mono text-xs flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-xs font-semibold text-foreground truncate" title={child.title}>
                                                        {child.title}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {child.badge && (
                                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                                            child.badge_type === 'success'
                                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                : child.badge_type === 'warning'
                                                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                                : 'bg-primary/10 text-primary border-primary/20'
                                                        }`}>
                                                            {child.badge}
                                                        </span>
                                                    )}
                                                    {child.is_deleted ? (
                                                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                                            Deleted
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════
                                TAB 3: CO-DELETED CASCADES
                               ══════════════════════════════════════════════ */}
                            {activeTab === 'cascades' && detail.cascade_items && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-300">
                                        <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                                        <div className="text-xs space-y-1">
                                            <div className="font-bold text-sm">Batch Cascade Deletion Detected</div>
                                            <div>
                                                These {detail.cascade_items.length} records were deleted concurrently in the same session (<span className="font-mono">{detail.deleted_session_id?.substring(0, 8)}...</span>).
                                                Restoring this {model} will simultaneously restore these associated records.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted text-foreground uppercase font-bold text-[11px] border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3">Model</th>
                                                    <th className="px-4 py-3">Item Name</th>
                                                    <th className="px-4 py-3">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border font-medium">
                                                {detail.cascade_items.map(item => (
                                                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                                                        <td className="px-4 py-2.5">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                                                                {item.model}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-foreground truncate max-w-xs">{item.name}</td>
                                                        <td className="px-4 py-2.5 text-muted-foreground">{new Date(item.deleted_at).toLocaleTimeString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════
                                TAB 4: AUDIT HISTORY TIMELINE
                               ══════════════════════════════════════════════ */}
                            {activeTab === 'audit' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <Activity className="size-4 text-primary" />
                                            Lifecycle & Audit Trail Events
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            Recorded chronological actions
                                        </span>
                                    </div>

                                    {(!detail.audit_trail || detail.audit_trail.length === 0) ? (
                                        <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                                            No explicit audit trail entries logged for this specific object ID.
                                        </div>
                                    ) : (
                                        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                            {detail.audit_trail.map(log => (
                                                <div key={log.id} className="relative space-y-1.5">
                                                    <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-card ${
                                                        log.action.includes('delete')
                                                            ? 'bg-rose-500'
                                                            : log.action.includes('update')
                                                            ? 'bg-amber-500'
                                                            : 'bg-emerald-500'
                                                    }`} />

                                                    <div
                                                        onClick={() => {
                                                            setSelectedAuditLogId(log.id);
                                                            setIsAuditModalOpen(true);
                                                        }}
                                                        className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1.5 hover:bg-muted/50 hover:border-primary/40 transition-all cursor-pointer group shadow-sm"
                                                        title="Click to view deep audit log details & telemetry"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                                log.action.includes('delete')
                                                                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                                    : log.action.includes('update')
                                                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                            }`}>
                                                                {log.action}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] text-muted-foreground font-mono">
                                                                    {new Date(log.created_at).toLocaleString()}
                                                                </span>
                                                                <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                                    <Eye className="size-3" />
                                                                    Inspect
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                                            {log.description}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                                                            <span>By: <strong className="text-foreground">{log.actor_name}</strong> {log.actor_email ? `(${log.actor_email})` : ''}</span>
                                                            <span>IP: <strong className="font-mono text-foreground">{log.ip_address}</strong></span>
                                                            <span>Location: {log.location}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                {/* 3. Footer */}
                <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                        {detail && (
                            <span>
                                Ready to restore? This will reactivate the {detail.model} and reconnect it to its parent hierarchy.
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Close
                        </Button>
                        {detail && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onRestore({ id: detail.id, model: detail.model, name: detail.name })}
                                disabled={isRestoring}
                            >
                                <RotateCcw className={`size-3.5 mr-1.5 ${isRestoring ? 'animate-spin' : ''}`} />
                                {isRestoring ? 'Restoring...' : 'Restore Record'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Audit Log Deep Inspection Modal */}
            <AuditLogDetailModal
                isOpen={isAuditModalOpen}
                onClose={() => {
                    setIsAuditModalOpen(false);
                    setSelectedAuditLogId(null);
                }}
                logId={selectedAuditLogId}
            />
        </div>
    );
}

export default TrashItemDetailModal;
