'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/LoadingSkeleton';
import { LinkifyText } from '@/components/LinkifyText';
import Link from 'next/link';

interface Alert {
    id: string;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    status: string;
    published_at: string;
}

export default function DashboardAlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchAlerts();
    }, [filter]);

    const fetchAlerts = async () => {
        setIsLoading(true);
        const params = new URLSearchParams({ ordering: '-published_at', scope: 'org' });
        if (filter !== 'all') params.set('severity', filter);
        const { data, error: e } = await apiFetch(`/api/v1/alerts/?${params.toString()}`);
        if (e) setError(e);
        else if (data?.results) setAlerts(data.results);
        else if (Array.isArray(data)) setAlerts(data);
        setIsLoading(false);
    };

    const handleAcknowledge = async (id: string) => {
        const { error: e } = await apiFetch(`/api/v1/alerts/${id}/acknowledge/`, { method: 'POST' });
        if (!e) fetchAlerts();
    };

    const handleViewDetails = (alert: Alert) => {
        handleAcknowledge(alert.id);
    };

    const severityStyles: Record<string, string> = {
        high: 'border-red-500 bg-red-50 text-red-700',
        medium: 'border-orange-500 bg-orange-50 text-orange-700',
        low: 'border-blue-500 bg-blue-50 text-blue-700'
    };

    return (
        <div className="pb-20">
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-20 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
                        Cybersecurity Alerts
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                        Real-time advisories on active threats and vulnerabilities.
                    </p>
                    <div className="flex justify-center">
                        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                            {['all', 'high', 'medium', 'low'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-4xl mx-auto mt-12">
                {error && <div role="alert" className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-8">{error}</div>}

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-32 w-full" />
                        ))}
                    </div>
                ) : alerts.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        }
                        title="No active alerts found"
                        description="Your digital environment is currently stable. Check back later for updates."
                    />
                ) : (
                    <div className="space-y-6">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`bg-white rounded-2xl border-l-[6px] shadow-sm overflow-hidden hover:shadow-md transition-shadow ${severityStyles[alert.severity.toLowerCase()] || 'border-gray-200'}`}
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${severityStyles[alert.severity.toLowerCase()]}`}>
                                                {alert.severity}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">
                                                {new Date(alert.published_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{alert.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                        <LinkifyText text={alert.message} />
                                    </p>
                                    <div className="flex justify-end pt-4 border-t border-gray-50">
                                        <button
                                            onClick={() => handleViewDetails(alert)}
                                            className="text-xs font-bold text-primary hover:underline uppercase tracking-widest inline-flex items-center gap-1"
                                        >
                                            Dismiss / Acknowledge
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-16 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
                    <h3 className="font-bold text-gray-900 mb-2">Want to receive alerts instantly?</h3>
                    <p className="text-sm text-gray-500 mb-6">Enable SMS or Email notifications in your profile to stay ahead of emerging threats.</p>
                    <Link href="/profile">
                        <Button variant="outline">Update Notification Settings</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
