'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    getPaymentApprovals,
    createPaymentApproval,
    updatePaymentApproval,
    deletePaymentApproval,
    approvePaymentApproval,
    rejectPaymentApproval,
    PaymentApproval,
    Organization
} from '@/lib/api';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';
import { toast } from 'react-hot-toast';

const SELECT_CLS = "block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white";

export default function PaymentApprovalsPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [approvals, setApprovals] = useState<PaymentApproval[]>([]);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    const [isActionLoading, setIsActionLoading] = useState(false);

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: 'approved' | 'rejected' } | null>(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isCreateExpanded, setIsCreateExpanded] = useState(false);
    const [formError, setFormError] = useState('');
    const [selectedApproval, setSelectedApproval] = useState<PaymentApproval | null>(null);
    const [form, setForm] = useState({ organization: '', amount: '' });

    const [deleteTarget, setDeleteTarget] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    const isSuperAdmin = user?.role === 'super_admin';
    const canCreate = user?.role === 'super_admin' || user?.role === 'org_admin';

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (!isSuperAdmin && user?.role !== 'org_admin') router.push('/dashboard');
            else {
                fetchOrgs();
            }
        }
    }, [isAuthenticated, authLoading, user, router]);

    useEffect(() => {
        if (!authLoading && isAuthenticated && (isSuperAdmin || user?.role === 'org_admin')) {
            fetchApprovals();
        }
    }, [isAuthenticated, authLoading, user, router, page, searchTerm]);

    const fetchOrgs = async () => {
        const { data } = await apiFetch('/api/v1/organizations/');
        if (data?.results) setOrgs(data.results);
        else if (Array.isArray(data)) setOrgs(data);
    };

    const fetchApprovals = async () => {
        setIsFetching(true); setError('');
        const params: Record<string, any> = {
            page: page.toString(),
            page_size: pageSize.toString(),
            ordering: '-created_at'
        };
        if (searchTerm) params.search = searchTerm;
        const { data, error: e } = await getPaymentApprovals(params);
        if (e) setError(e);
        else if (data?.results) {
            setApprovals(data.results);
            setTotalCount(data.count || 0);
        }
        else if (Array.isArray(data)) {
            setApprovals(data);
            setTotalCount(data.length);
        }
        setIsFetching(false);
    };

    const getOrgName = (id: string) => orgs.find(o => o.id === id)?.name || id;

    const toggleCreate = () => {
        if (!isCreateExpanded) {
            setSelectedApproval(null);
            setForm({ organization: '', amount: '' });
            setFormError('');
        }
        setIsCreateExpanded(!isCreateExpanded);
    };

    const openEditModal = (item: PaymentApproval) => {
        setSelectedApproval(item);
        setForm({ organization: item.organization, amount: item.amount });
        setFormError('');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault(); setFormError(''); setIsActionLoading(true);
        const isEditing = !!selectedApproval;

        if (!form.amount || isNaN(parseFloat(form.amount))) {
            setFormError('Please enter a valid amount.');
            setIsActionLoading(false);
            return;
        }

        const payload = { organization: form.organization, amount: form.amount };

        const { error: apiErr } = isEditing
            ? await updatePaymentApproval(selectedApproval!.id, payload)
            : await createPaymentApproval(payload);

        if (apiErr) {
            setFormError(apiErr);
            toast.error(apiErr);
        } else {
            toast.success(isEditing ? 'Payment request updated!' : 'Payment request created!');
            fetchApprovals();
            if (isEditing) {
                setIsFormModalOpen(false);
            } else {
                setIsCreateExpanded(false);
            }
        }
        setIsActionLoading(false);
    };

    const handleStatusUpdate = (id: string, status: 'approved' | 'rejected') => {
        setConfirmAction({ id, status });
        setIsApproveModalOpen(true);
    };

    const confirmStatusUpdate = async () => {
        if (!confirmAction) return;
        setIsActionLoading(true);

        const fn = confirmAction.status === 'approved' ? approvePaymentApproval : rejectPaymentApproval;
        const { error: apiErr } = await fn(confirmAction.id, {});

        if (apiErr) {
            setError(apiErr);
            toast.error(apiErr);
        } else {
            toast.success(`Payment ${confirmAction.status}!`);
            fetchApprovals();
            setIsApproveModalOpen(false);
        }
        setIsActionLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget.id) return;
        setIsActionLoading(true);
        const { error: e } = await deletePaymentApproval(deleteTarget.id);
        if (e) {
            setError(e || 'Failed to delete.');
            toast.error(e || 'Failed to delete.');
        } else {
            toast.success('Payment request deleted!');
            fetchApprovals();
        }
        setDeleteTarget({ isOpen: false, id: null });
        setIsActionLoading(false);
    };

    if (authLoading || isFetching) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
    if (!user || (!isSuperAdmin && user.role !== 'org_admin')) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Payment Approvals</h1>
                        <p className="text-gray-500">Review and manage organization payment verification requests.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by organization..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                {canCreate && (
                    <ExpandableCreateSection
                        title="Create Payment Request"
                        isOpen={isCreateExpanded}
                        onToggle={toggleCreate}
                    >
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {formError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{formError}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
                                <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} required disabled={isActionLoading} autoFocus>
                                    <option value="">Select Organization</option>
                                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <Input label="Amount (ETB)" type="number" step="0.01" min="0" placeholder="e.g. 1500.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required disabled={isActionLoading} />
                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
                                <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving...' : 'Create Request'}</Button>
                            </div>
                        </form>
                    </ExpandableCreateSection>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Organization</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Requested By</th>
                                <th className="px-6 py-4">Reviewed By</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {approvals.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">{searchTerm ? 'No payment approvals matched your search.' : 'No payment approvals found.'}</td></tr>
                            ) : approvals.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{getOrgName(a.organization)}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{a.amount} ETB</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${a.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                                a.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            }`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{a.created_by ? a.created_by.substring(0, 8) + '...' : '—'}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{a.reviewed_by ? a.reviewed_by.substring(0, 8) + '...' : '—'}</td>
                                    <td className="px-6 py-4 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-1.5">
                                            {isSuperAdmin && (
                                                <>
                                                    {a.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleStatusUpdate(a.id, 'approved')} className="px-2.5 py-1 bg-green-600 text-white rounded-md text-[10px] font-bold hover:bg-green-700 transition-colors uppercase tracking-wider">Approve</button>
                                                            <button onClick={() => handleStatusUpdate(a.id, 'rejected')} className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold hover:bg-red-700 transition-colors uppercase tracking-wider">Reject</button>
                                                        </>
                                                    )}
                                                    <button onClick={() => openEditModal(a)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md text-xs font-bold transition-colors">Edit</button>
                                                    <button onClick={() => setDeleteTarget({ isOpen: true, id: a.id })} className="text-red-500 hover:text-red-700 font-medium text-xs transition-colors">Delete</button>
                                                </>
                                            )}
                                            {!isSuperAdmin && a.status === 'pending' && (
                                                <span className="text-gray-400 text-xs italic">Awaiting review</span>
                                            )}
                                            {!isSuperAdmin && a.status !== 'pending' && (
                                                <span className="text-gray-400 text-xs italic">
                                                    {a.status === 'approved' ? 'Approved' : 'Rejected'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalCount > pageSize && (
                    <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                        <span className="text-sm text-gray-500">Showing {approvals.length} of {totalCount} requests</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <Button variant="outline" size="sm" disabled={(page * pageSize) >= totalCount || isFetching} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="Edit Payment Request">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {formError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{formError}</div>}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
                        <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} required disabled={isActionLoading} autoFocus>
                            <option value="">Select Organization</option>
                            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    <Input label="Amount (ETB)" type="number" step="0.01" min="0" placeholder="e.g. 1500.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required disabled={isActionLoading} />
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                onConfirm={confirmStatusUpdate}
                title={`${confirmAction?.status === 'approved' ? 'Approve' : 'Reject'} Payment`}
                message={`Are you sure you want to ${confirmAction?.status} this payment request? This action cannot be undone.`}
                confirmText={confirmAction?.status === 'approved' ? 'Approve' : 'Reject'}
                variant={confirmAction?.status === 'approved' ? 'info' : 'danger'}
                isLoading={isActionLoading}
            />

            <ConfirmModal
                isOpen={deleteTarget.isOpen}
                onClose={() => setDeleteTarget({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Payment Request"
                message="Are you sure you want to delete this payment request? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                isLoading={isActionLoading}
            />
        </div>
    );
}
