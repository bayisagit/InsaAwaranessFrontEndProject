'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/LoadingSkeleton';
import { AlertCard, AlertItem } from '@/components/alerts/AlertCard';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Search, Filter, RefreshCw, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'acknowledged'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Load dismissed alert IDs from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('insa_dismissed_alerts');
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ ordering: '-published_at' });
    if (severityFilter !== 'all') params.set('severity', severityFilter);
    const { data, error: e } = await apiFetch(`/api/v1/alerts/?${params.toString()}`);
    if (e) setError(e);
    else if (data?.results) setAlerts(data.results);
    else if (Array.isArray(data)) setAlerts(data);
    setIsLoading(false);
  };

  const handleAcknowledge = async (id: string) => {
    const { error: e } = await apiFetch(`/api/v1/alerts/${id}/acknowledge/`, { method: 'POST' });
    if (!e) {
      setAlerts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_acknowledged: true } : item))
      );
    }
  };

  const handleDismiss = (id: string) => {
    const nextDismissed = [...dismissedIds, id];
    setDismissedIds(nextDismissed);
    try {
      localStorage.setItem('insa_dismissed_alerts', JSON.stringify(nextDismissed));
    } catch {
      // Ignore storage errors
    }

    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-xs text-foreground font-medium">Advisory dismissed from view.</span>
          <button
            onClick={() => {
              handleUndoDismiss(id);
              toast.dismiss(t.id);
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
        </div>
      ),
      { duration: 4000 }
    );
  };

  const handleUndoDismiss = (id: string) => {
    const nextDismissed = dismissedIds.filter((item) => item !== id);
    setDismissedIds(nextDismissed);
    try {
      localStorage.setItem('insa_dismissed_alerts', JSON.stringify(nextDismissed));
    } catch {
      // Ignore
    }
  };

  const handleRestoreAllDismissed = () => {
    setDismissedIds([]);
    try {
      localStorage.removeItem('insa_dismissed_alerts');
    } catch {
      // Ignore
    }
    toast.success('All dismissed advisories restored to your feed.');
  };

  // Filter alerts by dismissal, search term, and acknowledgment status
  const visibleAlerts = useMemo(() => {
    return alerts
      .filter((alert) => !dismissedIds.includes(alert.id))
      .filter((alert) => {
        if (statusFilter === 'acknowledged') return !!alert.is_acknowledged;
        if (statusFilter === 'pending') return !alert.is_acknowledged;
        return true;
      })
      .filter((alert) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          alert.title?.toLowerCase().includes(q) ||
          alert.message?.toLowerCase().includes(q) ||
          alert.organization_name?.toLowerCase().includes(q)
        );
      });
  }, [alerts, dismissedIds, statusFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-muted/40 pb-20">
      {/* Header Banner */}
      <section className="bg-card border-b border-border shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="w-4 h-4" />
            Official Security Advisories
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            National Cybersecurity Threat Advisories
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-8">
            Verified threat bulletins, vulnerability notices, and actionable defense guidance issued by the Information Network Security Administration (INSA).
          </p>

          {/* Search & Filter Bar */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search advisories by threat keyword, CVE, or advisory title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Severity Filter Tabs */}
              <div className="flex items-center overflow-x-auto no-scrollbar max-w-full bg-muted p-1 rounded-xl shadow-inner text-xs font-bold">
                {[
                  { id: 'all', label: 'All Severities' },
                  { id: 'high', label: 'High' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'low', label: 'Low' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSeverityFilter(s.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      severityFilter === s.id
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center overflow-x-auto no-scrollbar max-w-full bg-muted p-1 rounded-xl shadow-inner text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'all'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({alerts.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'pending'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Unacknowledged
                </button>
                <button
                  onClick={() => setStatusFilter('acknowledged')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'acknowledged'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Acknowledged
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        {error && (
          <div role="alert" className="bg-destructive/10 text-destructive p-4 rounded-2xl border border-destructive/20 mb-8 text-sm">
            {error}
          </div>
        )}

        {/* Dismissed alerts banner if any are hidden */}
        {dismissedIds.length > 0 && (
          <div className="mb-6 p-3 bg-muted border border-border rounded-xl text-xs flex items-center justify-between gap-3">
            <span className="text-muted-foreground">
              {dismissedIds.length} {dismissedIds.length === 1 ? 'advisory is' : 'advisories are'} currently hidden from your feed.
            </span>
            <button
              onClick={handleRestoreAllDismissed}
              className="font-bold text-primary hover:underline cursor-pointer"
            >
              Restore All
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : visibleAlerts.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-10 h-10 text-emerald-500" />}
            title="No Active Threat Advisories"
            description={
              searchTerm || severityFilter !== 'all' || statusFilter !== 'all'
                ? 'No advisories match your active filters or search terms.'
                : 'Your threat environment is currently clear. No active security advisories require attention.'
            }
          />
        ) : (
          <div className="space-y-6">
            {visibleAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                onDismiss={handleDismiss}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}

        {/* Subscribe / Alert Preferences CTA */}
        <div className="mt-10 sm:mt-16 bg-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-border shadow-md shadow-black/5 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Want to receive advisories directly?</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Configure instant security email alerts in your account profile to stay informed about active cyber threats.
          </p>
          <Link href="/profile">
            <Button variant="outline" className="w-full sm:w-auto">Update Notification Settings</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
