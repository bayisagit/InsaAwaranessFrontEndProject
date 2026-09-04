'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
 getTrainingRequests,
 createTrainingRequest,
 approveTrainingRequest,
 rejectTrainingRequest,
 TrainingRequest,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { toast } from 'react-hot-toast';

// Roles that can VIEW training requests (org-scoped on backend)
const VIEW_ROLES = ['super_admin', 'org_admin', 'course_provider', 'member'];
// Roles that can SUBMIT a training request
const SUBMIT_ROLES = ['super_admin', 'org_admin', 'course_provider', 'member'];
// Only super_admin can approve/reject
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_COLORS = {
 pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
 approved: 'bg-green-50 text-green-700 border-green-200',
 rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminTrainingRequestsPage() {
 const { user, isAuthenticated, isLoading } = useAuth();
 const router = useRouter();

 const [requests, setRequests] = useState<TrainingRequest[]>([]);
 const [totalCount, setTotalCount] = useState(0);
 const [isFetching, setIsFetching] = useState(true);
 const [error, setError] = useState('');
 const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
 const [actionLoading, setActionLoading] = useState<string | null>(null);

 const [isCreateExpanded, setIsCreateExpanded] = useState(false);
 const [createLoading, setCreateLoading] = useState(false);
 const [createError, setCreateError] = useState('');
 const [formData, setFormData] = useState({ description: '', attachment_url: '' });

 // Reject confirm
 const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
 const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);

 const fetchAll = useCallback(async (filter: StatusFilter = statusFilter) => {
 setIsFetching(true);
 setError('');
 const params: Record<string, any> = {};
 if (filter !== 'all') params.status = filter;

 const { data, error: e } = await getTrainingRequests(params);
 if (e) {
 setError(e);
 } else if (data) {
 setRequests(data.results ?? (Array.isArray(data) ? data : []));
 setTotalCount(data.count ?? 0);
 }
 setIsFetching(false);
 }, [statusFilter]);

 useEffect(() => {
 if (!isLoading) {
 if (!isAuthenticated) router.push('/login');
 else if (!VIEW_ROLES.includes(user?.role || '')) router.push('/dashboard');
 else fetchAll(statusFilter);
 }
 }, [isAuthenticated, isLoading, user, router, statusFilter]);

 const handleApprove = async (id: string) => {
 setActionLoading(id);
 const { error: e, status } = await approveTrainingRequest(id);
 if (e || status !== 200) {
 toast.error(e || 'Failed to approve request.');
 } else {
 toast.success('Training request approved.');
 fetchAll(statusFilter);
 }
 setActionLoading(null);
 };

 const handleRejectConfirm = async () => {
 if (!rejectTargetId) return;
 setActionLoading(rejectTargetId);
 const { error: e, status } = await rejectTrainingRequest(rejectTargetId);
 if (e || status !== 200) {
 toast.error(e || 'Failed to reject request.');
 } else {
 toast.success('Training request rejected.');
 fetchAll(statusFilter);
 }
 setIsRejectConfirmOpen(false);
 setRejectTargetId(null);
 setActionLoading(null);
 };

 const toggleCreate = () => {
 if (!isCreateExpanded) {
 setCreateError('');
 setFormData({ description: '', attachment_url: '' });
 }
 setIsCreateExpanded(!isCreateExpanded);
 };

 const handleCreateSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setCreateError('');
 setCreateLoading(true);

 if (!formData.description.trim()) {
 setCreateError('Description is required.');
 setCreateLoading(false);
 return;
 }

 if (!formData.attachment_url.trim()) {
 setCreateError('A supporting document is required.');
 setCreateLoading(false);
 return;
 }

 // Per API docs: DO NOT send organization, created_by, status, etc.
 // Backend auto-assigns the caller's primary organization.
 const payload: { description: string; attachment_url: string } = {
 description: formData.description.trim(),
 attachment_url: formData.attachment_url.trim(),
 };

 const { error: err, status } = await createTrainingRequest(payload);

 if (err || (status !== 200 && status !== 201)) {
 setCreateError(err || 'Failed to submit training request.');
 } else {
 toast.success('Training request submitted successfully!');
 setIsCreateExpanded(false);
 setFormData({ description: '', attachment_url: '' });
 fetchAll(statusFilter);
 }
 setCreateLoading(false);
 };

 const canSubmit = SUBMIT_ROLES.includes(user?.role || '');
 const canApproveReject = user?.role === 'super_admin';

 if (isLoading) return (
 <div className="flex justify-center items-center min-h-[50vh]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
 </div>
 );
 if (!user || !VIEW_ROLES.includes(user.role)) return null;

 return (
 <div className="min-h-screen bg-muted pb-20">
 {/* Header */}
 <div className="bg-card border-b border-border">
 <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-1">Training Requests</h1>
 <p className="text-muted-foreground">
 {canApproveReject
 ? 'Review and approve organizational training requests.'
 : 'Submit and track your organization\'s training requests.'}
 </p>
 </div>
 </div>

 {/* Status filter tabs */}
 <div className="max-w-7xl mx-auto px-6 lg:px-12 flex gap-0 border-t border-border">
 {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(tab => (
 <button
 key={tab}
 onClick={() => setStatusFilter(tab)}
 className={`px-5 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
 statusFilter === tab
 ? 'border-primary text-primary'
 : 'border-transparent text-muted-foreground hover:text-foreground'
 }`}
 >
 {tab === 'all' ? 'All' : tab}
 </button>
 ))}
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-8 cursor-pointer">
 {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

 {canSubmit && (
 <div className="mb-6">
 <ExpandableCreateSection
 title="Submit Request"
 isOpen={isCreateExpanded}
 onToggle={toggleCreate}
 >
 <form onSubmit={handleCreateSubmit} className="space-y-4">
 {createError && (
 <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{createError}</div>
 )}

 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">
 Description <span className="text-primary">*</span>
 </label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 min-h-[120px] resize-y"
 placeholder="Describe the training requirements, topics, number of employees, and expected outcomes…"
 value={formData.description}
 onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
 required
 disabled={createLoading}
 autoFocus
 />
 </div>

 <div className="space-y-1">
 <label className="block text-sm font-semibold text-foreground mb-1">
 Supporting Document <span className="text-primary">*</span>
 </label>
 <CloudinaryUpload
 onUploadSuccess={(url) => setFormData(f => ({ ...f, attachment_url: url }))}
 />
 {formData.attachment_url && (
 <p className="text-[11px] text-green-600 font-medium mt-1">✓ File uploaded successfully</p>
 )}
 </div>

 <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
 Your request will be automatically linked to your organization and submitted for Super Admin review.
 </div>

 <div className="pt-4 flex flex-wrap justify-end gap-3 min-w-fit">
 <Button
 type="button"
 variant="outline"
 onClick={() => { setIsCreateExpanded(false); setCreateError(''); }}
 disabled={createLoading}
 >
 Cancel
 </Button>
 <Button type="submit" variant="primary" disabled={createLoading}>
 {createLoading ? 'Submitting…' : 'Submit Request'}
 </Button>
 </div>
 </form>
 </ExpandableCreateSection>
 </div>
 )}

 {isFetching ? (
 <div className="space-y-4">
 {Array.from({ length: 3 }).map((_, i) => (
 <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
 <div className="h-5 bg-muted/50 rounded w-1/3 mb-3" />
 <div className="h-4 bg-muted/50 rounded w-2/3 mb-2" />
 <div className="h-3 bg-muted/50 rounded w-1/4" />
 </div>
 ))}
 </div>
 ) : requests.length === 0 ? (
 <div className="bg-card rounded-xl border border-border p-16 text-center">
 <div className="text-4xl mb-4">📋</div>
 <p className="font-medium text-foreground">
 {statusFilter === 'all' ? 'No training requests yet.' : `No ${statusFilter} requests.`}
 </p>
 <p className="text-muted-foreground text-sm mt-1">
 {canSubmit ? 'Submit a request using the button above.' : 'Training requests from your organization will appear here.'}
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {requests.map(req => (
 <div key={req.id} className="bg-card rounded-xl border border-border p-6">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-2 flex-wrap">
 <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[req.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
 {req.status}
 </span>
 <span className="text-xs text-muted-foreground">
 {new Date(req.created_at).toLocaleDateString()}
 </span>
 </div>
 <p className="text-foreground text-sm leading-relaxed mb-3 line-clamp-3">
 {req.description}
 </p>
 {req.attachment_url && (
 <a
 href={req.attachment_url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline bg-primary/5 px-2.5 py-1.5 rounded-xl border border-primary/10 transition-colors"
 >
 <span>📎</span> View Attachment
 </a>
 )}
 </div>
 {canApproveReject && req.status === 'pending' && (
 <div className="flex gap-2 shrink-0">
 <Button
 variant="primary"
 size="sm"
 disabled={!!actionLoading}
 onClick={() => handleApprove(req.id)}
 >
 {actionLoading === req.id ? '…' : 'Approve'}
 </Button>
 <Button
 variant="outline"
 size="sm"
 className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
 disabled={!!actionLoading}
 onClick={() => { setRejectTargetId(req.id); setIsRejectConfirmOpen(true); }}
 >
 Reject
 </Button>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Reject Confirm */}
 <ConfirmModal
 isOpen={isRejectConfirmOpen}
 onClose={() => { setIsRejectConfirmOpen(false); setRejectTargetId(null); }}
 onConfirm={handleRejectConfirm}
 title="Reject Training Request"
 message="Are you sure you want to reject this training request? The submitting organization will need to re-submit if they wish to proceed."
 confirmText="Reject"
 isLoading={!!actionLoading}
 />
 </div>
 );
}