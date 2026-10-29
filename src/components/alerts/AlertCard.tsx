'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Share2,
  EyeOff,
  Building2,
  Globe2,
  Check,
} from 'lucide-react';
import { LinkifyText } from '@/components/LinkifyText';
import toast from 'react-hot-toast';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | string;
  status?: string;
  organization?: string | null;
  organization_name?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  is_acknowledged?: boolean;
}

interface AlertCardProps {
  alert: AlertItem;
  onAcknowledge: (id: string) => Promise<void> | void;
  onDismiss?: (id: string) => void;
  isAuthenticated?: boolean;
}

export function formatAlertDate(dateStr?: string | null, createdStr?: string | null): string {
  const raw = dateStr || createdStr;
  if (!raw) return 'Recently issued';

  const d = new Date(raw);
  // Guard against epoch or corrupt zero-dates (e.g. 1970)
  if (isNaN(d.getTime()) || d.getTime() < 100000000000) {
    return 'Recently issued';
  }

  // Format cleanly: "Oct 23, 2026 • 12:23 PM"
  const dateFormatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${dateFormatted} • ${timeFormatted}`;
}

export function AlertCard({
  alert,
  onAcknowledge,
  onDismiss,
  isAuthenticated = false,
}: AlertCardProps) {
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [acknowledged, setAcknowledged] = useState(!!alert.is_acknowledged);
  const [copied, setCopied] = useState(false);

  const severity = alert.severity?.toLowerCase() || 'low';

  const handleAckClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (acknowledged || isAcknowledging) return;

    setIsAcknowledging(true);
    try {
      await onAcknowledge(alert.id);
      setAcknowledged(true);
      toast.success('Advisory acknowledged. Thank you for staying vigilant.');
    } catch {
      toast.error('Failed to acknowledge alert.');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/alerts#${alert.id}` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${alert.title}\n\n${alert.message}\n\n${url}`);
      setCopied(true);
      toast.success('Advisory copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(alert.id);
    }
  };

  // Severity visual configurations
  const config = {
    high: {
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      borderAccent: 'border-l-rose-500',
      icon: ShieldAlert,
      iconColor: 'text-rose-500',
      label: 'CRITICAL THREAT',
      glow: 'shadow-rose-500/5',
    },
    medium: {
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      borderAccent: 'border-l-amber-500',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      label: 'WARNING ADVISORY',
      glow: 'shadow-amber-500/5',
    },
    low: {
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      borderAccent: 'border-l-blue-500',
      icon: Info,
      iconColor: 'text-blue-500',
      label: 'SECURITY NOTICE',
      glow: 'shadow-blue-500/5',
    },
  }[severity as 'high' | 'medium' | 'low'] || {
    badgeBg: 'bg-muted text-foreground border-border',
    borderAccent: 'border-l-primary',
    icon: Info,
    iconColor: 'text-primary',
    label: 'ADVISORY',
    glow: 'shadow-black/5',
  };

  const SeverityIcon = config.icon;

  return (
    <article
      id={alert.id}
      className={`relative bg-card rounded-2xl border border-border border-l-4 ${config.borderAccent} shadow-md ${config.glow} transition-all duration-200 hover:shadow-lg dark:hover:shadow-black/30 overflow-hidden group`}
    >
      <div className="p-4 sm:p-6">
        {/* Top Header: Severity + Metadata + Dismiss */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border ${config.badgeBg}`}
            >
              <SeverityIcon className="w-3.5 h-3.5" />
              {config.label}
            </span>

            {/* Target Audience Badge */}
            {alert.organization_name ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                <Building2 className="w-3 h-3 text-primary" />
                {alert.organization_name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                <Globe2 className="w-3 h-3 text-emerald-500" />
                Public Advisory
              </span>
            )}

            {/* Verified Acknowledged Status Pill */}
            {acknowledged && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Acknowledged
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {formatAlertDate(alert.published_at, alert.created_at)}
            </span>

            {onDismiss && (
              <button
                onClick={handleDismissClick}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ml-1"
                title="Dismiss from your view"
                aria-label="Dismiss this advisory"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2.5 tracking-tight group-hover:text-primary transition-colors">
          {alert.title}
        </h2>

        {/* Advisory Message Content */}
        <div className="text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
          <LinkifyText text={alert.message} />
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border border-border/80 transition-all cursor-pointer"
              title="Share or copy this advisory"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Share'}
            </button>

            {onDismiss && (
              <button
                onClick={handleDismissClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Dismiss
              </button>
            )}
          </div>

          {/* Primary Acknowledge Action Button */}
          <div className="w-full sm:w-auto">
            {acknowledged ? (
              <div className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Acknowledged & Logged</span>
              </div>
            ) : (
              <button
                onClick={handleAckClick}
                disabled={isAcknowledging}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                title={
                  isAuthenticated
                    ? 'Confirm you have read and understood this threat advisory'
                    : 'Acknowledge this advisory'
                }
              >
                {isAcknowledging ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Acknowledge Threat</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
