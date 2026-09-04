'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
 getOrgApplications,
 approveOrgApplication,
 rejectOrgApplication,
 OrganizationApplication,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from 'react-hot-toast';

type StatusTab = 'pending' | 'approved' | 'rejected';

const PAGE_SIZE = 15;

const STATUS_COLORS: Record<StatusTab, string> = {
 pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
 approved: 'bg-green-50 text-green-700 border-green-200',
 rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminOrgApplicationsPage() {
 const { user, isAuthenticated, isLoading } = useAuth();
 const router = useRouter();

 const [activeTab, setActiveTab] = useState<StatusTab>('pending');
 const [applications, setApplications] = useState<OrganizationApplication[]>([]);
 const [totalCount, setTotalCount] = useState(0);
 const [page, setPage] = useState(1);
 const [isFetching, setIsFetching] = useState(true);
 const [error, setError] = useState('');
 const [actionLoading, setActionLoading] = useState<string | null>(null);

 // Detail modal
 const [selectedApp, setSelectedApp] = useState<OrganizationApplication | null>(null);
 const [isDetailOpen, setIsDetailOpen] = useState(false);

 // Reject confirm
 const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
 const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);

 const fetchApplications = useCallback(async (tab = activeTab, p = page) => {
 setIsFetching(true);
 setError('');
 const { data, error: e } = await getOrgApplications({ status: tab, page: p, page_size: PAGE_SIZE });
 if (e) { setError(e); }
 else if (data) {
 setApplications(data.results);
 setTotalCount(data.count);
 }
 setIsFetching(false);
 }, []);

 useEffect(() => {
 if (!isLoading) {
 if (!isAuthenticated) router.push('/login');
 else if (user?.role !== 'super_admin') router.push('/dashboard');
 else fetchApplications(activeTab, page);
 }
 }, [isAuthenticated, isLoading, user, router, activeTab, page]);

 const handleTabChange = (tab: StatusTab) => {
 setActiveTab(tab);
 setPage(1);
 };

 const handleApprove = async (app: OrganizationApplication) => {
 setActionLoading(app.id);
 const { data, error: e, status } = await approveOrgApplication(app.id);
 if (e || status !== 200) {
 toast.error(e || 'Failed to approve application.');
 } else {
 toast.success(
 `✅ "${app.name}" approved! Organization ID: ${data?.organization_id?.slice(0, 8)}…`,
 { duration: 6000 }
 );
 fetchApplications(activeTab, page);
 }
 setActionLoading(null);
 };

 const handleRejectConfirm = async () => {
 if (!rejectTargetId) return;
 setActionLoading(rejectTargetId);
 const { error: e, status } = await rejectOrgApplication(rejectTargetId);
 if (e || status !== 200) {
 toast.error(e || 'Failed to reject application.');
 } else {
 toast.success('Application rejected.');
 fetchApplications(activeTab, page);
 }
 setIsRejectConfirmOpen(false);
 setRejectTargetId(null);
 setActionLoading(null);
 };

 const totalPages = Math.ceil(totalCount / PAGE_SIZE);

 if (isLoading) return (
 <div className="flex justify-center items-center min-h-[50vh]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
 </div>
 );
 if (!user || user.role !== 'super_admin') return null;

 return (
 <div className="min-h-screen bg-muted pb-20">
 {/* Header */}
 <div className="bg-card border-b border-border">
 <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
 <h1 className="text-3xl font-bold text-foreground mb-1">Organization Applications</h1>
 <p className="text-muted-foreground">Review and act on pending organizational join requests.</p>
 </div>

 {/* Tabs */}
 <div className="max-w-7xl mx-auto px-6 lg:px-12 flex gap-0 border-t border-border">
 {(['pending', 'approved', 'rejected'] as StatusTab[]).map(tab => (
 <button
 key={tab}
 onClick={() => handleTabChange(tab)}
 className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
 activeTab === tab
 ? 'border-primary text-primary'
 : 'border-transparent text-muted-foreground hover:text-foreground'
 }`}
 >
 {tab}
 {tab === 'pending' && totalCount > 0 && activeTab === 'pending' && (
 <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full font-bold cursor-pointer">
 {totalCount}
 </span>
 )}
 </button>
 ))}
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-8">
 {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

 <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
 <table className="w-full text-left text-sm text-muted-foreground">
 <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
 <tr>
 <th className="px-6 py-4">Organization</th>
 <th className="px-6 py-4 hidden md:table-cell">Contact</th>
 <th className="px-6 py-4 hidden lg:table-cell">Address</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 hidden lg:table-cell">Submitted</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {isFetching ? (
 Array.from({ length: 5 }).map((_, i) => (
 <tr key={i}>
 {[1, 2, 3, 4, 5, 6].map(j => (
 <td key={j} className="px-6 py-4">
 <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
 </td>
 ))}
 </tr>
 ))
 ) : applications.length === 0 ? (
 <tr>
 <td colSpan={6} className="px-6 py-16 text-center">
 <div className="text-4xl mb-3">
 {activeTab === 'pending' ? '📬' : activeTab === 'approved' ? '✅' : '🚫'}
 </div>
 <p className="font-medium text-foreground">No {activeTab} applications</p>
 <p className="text-sm text-muted-foreground mt-1">
 {activeTab === 'pending' ? 'New applications will appear here.' : `No applications have been ${activeTab} yet.`}
 </p>
 </td>
 </tr>
 ) : applications.map(app => (
 <tr key={app.id} className="hover:bg-muted transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-foreground">{app.name}</p>
 {app.website && (
 <a href={app.website} target="_blank" rel="noopener noreferrer"
 className="text-xs text-primary hover:underline">
 {app.website}
 </a>
 )}
 </td>
 <td className="px-6 py-4 hidden md:table-cell">
 <p className="text-foreground">{app.contact_email}</p>
 <p className="text-xs text-muted-foreground">{app.contact_phone}</p>
 </td>
 <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground max-w-[180px]">
 <span className="line-clamp-1">{app.address}</span>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[app.status]}`}>
 {app.status}
 </span>
 </td>
 <td className="px-6 py-4 text-xs text-muted-foreground hidden lg:table-cell">
 {new Date(app.created_at).toLocaleDateString()}
 </td>
 <td className="px-6 py-4 text-right whitespace-nowrap">
 <button
 onClick={() => { setSelectedApp(app); setIsDetailOpen(true); }}
 className="text-muted-foreground hover:text-foreground font-medium mr-3 transition-colors text-sm cursor-pointer"
 >
 View
 </button>
 {app.status === 'pending' && (
 <>
 <button
 onClick={() => handleApprove(app)}
 disabled={actionLoading === app.id}
 className="text-green-600 hover:text-green-800 font-semibold mr-3 transition-colors text-sm disabled:opacity-50 cursor-pointer"
 >
 {actionLoading === app.id ? '…' : 'Approve'}
 </button>
 <button
 onClick={() => { setRejectTargetId(app.id); setIsRejectConfirmOpen(true); }}
 disabled={!!actionLoading}
 className="text-red-500 hover:text-red-700 font-semibold transition-colors text-sm disabled:opacity-50 cursor-pointer"
 >
 Reject
 </button>
 </>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="mt-5 flex justify-between items-center bg-card p-4 rounded-xl border border-border">
 <span className="text-sm text-muted-foreground">Page {page} of {totalPages} · {totalCount} total</span>
 <div className="flex gap-2">
 <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage(p => p - 1)}>
 Previous
 </Button>
 <Button variant="outline" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage(p => p + 1)}>
 Next
 </Button>
 </div>
 </div>
 )}
 </div>

 {/* Detail Modal */}
 <Modal
 isOpen={isDetailOpen}
 onClose={() => setIsDetailOpen(false)}
 title="Application Details"
 >
 {selectedApp && (
 <div className="space-y-4 text-sm">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Organization</p>
 <p className="font-medium text-foreground">{selectedApp.name}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</p>
 <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[selectedApp.status]}`}>
 {selectedApp.status}
 </span>
 </div>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Description</p>
 <p className="text-foreground leading-relaxed">{selectedApp.description}</p>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Contact Email</p>
 <p className="text-foreground">{selectedApp.contact_email}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Contact Phone</p>
 <p className="text-foreground">{selectedApp.contact_phone}</p>
 </div>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Address</p>
 <p className="text-foreground">{selectedApp.address}</p>
 </div>
 {selectedApp.website && (
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Website</p>
 <a href={selectedApp.website} target="_blank" rel="noopener noreferrer"
 className="text-primary hover:underline">{selectedApp.website}</a>
 </div>
 )}
 {selectedApp.reviewed_at && (
 <div>
 <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Reviewed At</p>
 <p className="text-foreground">{new Date(selectedApp.reviewed_at).toLocaleString()}</p>
 </div>
 )}
 {selectedApp.status === 'pending' && (
 <div className="pt-4 flex flex-wrap gap-3 justify-end border-t border-border min-w-fit">
 <Button
 variant="outline"
 className="text-red-500 border-red-200"
 onClick={() => {
 setIsDetailOpen(false);
 setRejectTargetId(selectedApp.id);
 setIsRejectConfirmOpen(true);
 }}
 >
 Reject
 </Button>
 <Button
 variant="primary"
 disabled={actionLoading === selectedApp.id}
 onClick={() => { setIsDetailOpen(false); handleApprove(selectedApp); }}
 >
 {actionLoading === selectedApp.id ? 'Approving…' : 'Approve'}
 </Button>
 </div>
 )}
 </div>
 )}
 </Modal>

 {/* Reject Confirm Modal */}
 <ConfirmModal
 isOpen={isRejectConfirmOpen}
 onClose={() => { setIsRejectConfirmOpen(false); setRejectTargetId(null); }}
 onConfirm={handleRejectConfirm}
 title="Reject Application"
 message="Are you sure you want to reject this organization application? This action sets the status to 'rejected'."
 confirmText="Reject"
 isLoading={!!actionLoading}
 />
 </div>
 );
}
