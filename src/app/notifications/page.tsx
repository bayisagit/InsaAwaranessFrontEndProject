'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/Input';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { LinkifyText } from '@/components/LinkifyText';

interface NotificationData {
 id: string;
 message: string;
 is_read: boolean;
 created_at: string;
 type?: string;
}

export default function NotificationsPage() {
 const { isAuthenticated, isLoading: authLoading } = useAuth();
 const [notifications, setNotifications] = useState<NotificationData[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState('');

 const [searchTerm, setSearchTerm] = useState('');
 const [page, setPage] = useState(1);
 const [totalCount, setTotalCount] = useState(0);
 const pageSize = 10;

 useEffect(() => {
 if (!authLoading && isAuthenticated) {
 fetchNotifications();
 }
 }, [isAuthenticated, authLoading, page, searchTerm]);

 const fetchNotifications = async () => {
 setIsLoading(true);
 const query = new URLSearchParams({
 page: page.toString(),
 page_size: pageSize.toString(),
 search: searchTerm,
 ordering: '-created_at'
 }).toString();

 const { data, error: apiError } = await apiFetch(`/api/v1/notifications/?${query}`);
 if (apiError) setError(apiError);
 else if (data?.results) {
 setNotifications(data.results);
 setTotalCount(data.count || 0);
 } else if (Array.isArray(data)) {
 setNotifications(data);
 setTotalCount(data.length);
 }
 setIsLoading(false);
 };

 const toggleReadStatus = async (id: string, currentlyRead: boolean) => {
 const action = currentlyRead ? 'mark_unread' : 'mark_read';
 const { error: apiErr } = await apiFetch(`/api/v1/notifications/${id}/${action}/`, {
 method: 'POST'
 });

 if (!apiErr) {
 // Optimistic update
 setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: !currentlyRead } : n));
 }
 };

 const formatDate = (dateStr: string) => {
 try {
 return new Date(dateStr).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
 } catch {
 return dateStr;
 }
 };

 if (authLoading || isLoading) {
 return (
 <div className="min-h-screen bg-muted flex items-center justify-center">
 <div aria-label="Loading" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-muted pb-20">
 <PageHeader
 title="Notifications"
 description="Stay up to date with system alerts and updates."
 actions={
 <div className="w-full md:w-64">
 <Input
 placeholder="Search messages..."
 value={searchTerm}
 onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
 />
 </div>
 }
 />

 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 mt-8">
 {error && (
 <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>
 )}

 {notifications.length === 0 ? (
 <EmptyState
 icon={
 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
 </svg>
 }
 title="No notifications found"
 description="Refine your search or check back later for updates."
 />
 ) : (
 <div className="space-y-3">
 {notifications.map((n) => (
 <div
 key={n.id}
 className={`group bg-card rounded-xl border p-5 flex gap-4 transition-all hover:border-primary/30 ${n.is_read ? 'border-border' : 'border-primary/20 shadow-sm shadow-black/5 dark:shadow-none'}`}
 >
 <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-gray-200' : 'bg-primary'}`}></div>
 <div className="flex-1">
 <div className="flex justify-between items-start gap-4">
 <p className={`text-sm ${n.is_read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}><LinkifyText text={n.message} /></p>
 <button
 onClick={() => toggleReadStatus(n.id, n.is_read)}
 className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${n.is_read ? 'text-primary hover:bg-primary/5' : 'text-muted-foreground hover:bg-muted/50'}`}
 title={n.is_read ? "Mark as unread" : "Mark as read"}
 >
 {n.is_read ? "Keep as unread" : "Mark read"}
 </button>
 </div>
 <div className="flex items-center gap-3 mt-2 cursor-pointer">
 {n.type && (
 <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border font-bold uppercase tracking-tight">
 {n.type.replace(/_/g, ' ')}
 </span>
 )}
 <span className="text-[11px] text-muted-foreground font-medium">{formatDate(n.created_at)}</span>
 </div>
 </div>
 </div>
 ))}

 <Pagination
 page={page}
 pageSize={pageSize}
 totalCount={totalCount}
 isLoading={isLoading}
 onPageChange={setPage}
 label="notifications"
 />
 </div>
 )}
 </div>
 </div>
 );
}
