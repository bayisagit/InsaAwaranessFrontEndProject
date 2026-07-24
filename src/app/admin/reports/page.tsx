'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    getComplianceReports,
    createComplianceReport,
    updateComplianceReport,
    deleteComplianceReport,
    ComplianceReport,
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

const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-50 text-blue-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700'
};

export default function AdminReportsPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [reports, setReports] = useState<ComplianceReport[]>([]);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateExpanded, setIsCreateExpanded] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selected, setSelected] = useState<ComplianceReport | null>(null);
    const [form, setForm] = useState({
        organization: '',
        title: '',
        status: 'draft' as ComplianceReport['status'],
        report_data: ''
    });

    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    const canWrite = user?.role === 'super_admin' || user?.role === 'org_admin';

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (user?.role !== 'super_admin' && user?.role !== 'org_admin') router.push('/dashboard');
            else {
                fetchOrgs();
            }
        }
    }, [isAuthenticated, authLoading, user, router]);

    useEffect(() => {
        if (!authLoading && isAuthenticated && (user?.role === 'super_admin' || user?.role === 'org_admin')) {
            fetchReports();
        }
    }, [isAuthenticated, authLoading, user, router, page, searchTerm]);

    const fetchOrgs = async () => {
        const { data } = await apiFetch('/api/v1/organizations/');
        if (data?.results) setOrgs(data.results);
        else if (Array.isArray(data)) setOrgs(data);
    };

    const fetchReports = async () => {
        setIsFetching(true); setError('');
        const params: Record<string, any> = {
            page: page.toString(),
            page_size: pageSize.toString(),
            ordering: '-created_at'
        };
        if (searchTerm) params.search = searchTerm;
        const { data, error: e } = await getComplianceReports(params);
        if (e) setError(e);
        else if (data?.results) {
            setReports(data.results);
            setTotalCount(data.count || 0);
        }
        else if (Array.isArray(data)) {
            setReports(data);
            setTotalCount(data.length);
        }
        setIsFetching(false);
    };

    const getOrgName = (id: string) => orgs.find(o => o.id === id)?.name || id;

    const openModal = (item: ComplianceReport) => {
        setActionError('');
        setIsCreateExpanded(false);
        setSelected(item);
        setForm({
            organization: item.organization || '',
            title: item.title,
            status: item.status,
            report_data: item.report_data ? JSON.stringify(item.report_data, null, 2) : '{}'
        });
        setIsModalOpen(true);
    };

    const toggleCreate = () => {
        if (!isCreateExpanded) {
            setActionError('');
            setSelected(null);
            setForm({
                organization: user?.role === 'org_admin' ? (user.organization_id || '') : '',
                title: '',
                status: 'draft',
                report_data: '{}'
            });
        }
        setIsCreateExpanded(!isCreateExpanded);
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault(); setActionError(''); setIsActionLoading(true);
        const isEditing = !!selected;

        let parsedReportData: Record<string, any> = {};
        try {
            parsedReportData = JSON.parse(form.report_data);
        } catch {
            setActionError('Invalid JSON in report data field.');
            setIsActionLoading(false);
            return;
        }

        const payload = {
            organization: form.organization,
            title: form.title,
            status: form.status,
            report_data: parsedReportData
        };

        const { error: apiErr } = isEditing
            ? await updateComplianceReport(selected!.id, payload)
            : await createComplianceReport(payload);

        if (apiErr) {
            setActionError(apiErr);
            toast.error(apiErr);
        } else {
            toast.success(isEditing ? 'Report updated successfully!' : 'Report created successfully!');
            fetchReports();
            if (isEditing) {
                setIsModalOpen(false);
            } else {
                setIsCreateExpanded(false);
            }
        }
        setIsActionLoading(false);
    };

    const handleDelete = async () => {
        if (!confirmDelete.id) return;
        setIsActionLoading(true);
        const { error: e } = await deleteComplianceReport(confirmDelete.id);
        if (e) {
            setError(e || 'Failed to delete.');
            toast.error(e || 'Failed to delete.');
        } else {
            toast.success('Report deleted successfully!');
            fetchReports();
        }
        setConfirmDelete({ isOpen: false, id: null });
        setIsActionLoading(false);
    };

    if (authLoading || isFetching) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
    if (!user || (user.role !== 'super_admin' && user.role !== 'org_admin')) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Compliance Reports</h1>
                        <p className="text-gray-500">Manage organizational compliance and training reports.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Search reports by title..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                {canWrite && (
                    <ExpandableCreateSection
                        title="Create Report"
                        isOpen={isCreateExpanded}
                        onToggle={toggleCreate}
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}

                            <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

                            <div className="grid grid-cols-2 gap-4">
                                {user?.role === 'org_admin' ? (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
                                        <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-medium text-sm">
                                            {user.organization_name || 'Your Organization'}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
                                        <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} required disabled={isActionLoading}>
                                            <option value="">Select Organization</option>
                                            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ComplianceReport['status'] })} disabled={isActionLoading}>
                                        <option value="draft">Draft</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Report Data (JSON)</label>
                                <textarea
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[150px] resize-y"
                                    placeholder='{ "findings": [], "summary": "" }'
                                    value={form.report_data}
                                    onChange={e => setForm({ ...form, report_data: e.target.value })}
                                    disabled={isActionLoading}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
                                <Button type="submit" variant="primary" disabled={isActionLoading}>
                                    {isActionLoading ? 'Saving...' : 'Create Report'}
                                </Button>
                            </div>
                        </form>
                    </ExpandableCreateSection>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Organization</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4">Updated</th>
                                {canWrite && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={canWrite ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm ? 'No reports matched your search.' : 'No compliance reports yet.'}
                                    </td>
                                </tr>
                            ) : reports.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{r.title}</div>
                                        {r.report_data && Object.keys(r.report_data).length > 0 && (
                                            <div className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-xs">
                                                {JSON.stringify(r.report_data).substring(0, 80)}...
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{getOrgName(r.organization)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[r.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                                        {new Date(r.updated_at).toLocaleDateString()}
                                    </td>
                                    {canWrite && (
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <button onClick={() => openModal(r)} className="text-secondary hover:text-primary font-medium mr-3 transition-colors">Edit</button>
                                            <button onClick={() => setConfirmDelete({ isOpen: true, id: r.id })} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalCount > pageSize && (
                    <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                        <span className="text-sm text-gray-500">Showing {reports.length} of {totalCount} reports</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <Button variant="outline" size="sm" disabled={(page * pageSize) >= totalCount || isFetching} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Report">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}

                    <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

                    <div className="grid grid-cols-2 gap-4">
                        {user?.role === 'org_admin' ? (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
                                <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-medium text-sm">
                                    {user.organization_name || 'Your Organization'}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
                                <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} required disabled={isActionLoading}>
                                    <option value="">Select Organization</option>
                                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                            <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ComplianceReport['status'] })} disabled={isActionLoading}>
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Report Data (JSON)</label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[150px] resize-y"
                            placeholder='{ "findings": [], "summary": "" }'
                            value={form.report_data}
                            onChange={e => setForm({ ...form, report_data: e.target.value })}
                            disabled={isActionLoading}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>
                            {isActionLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="Delete Report"
                message="Are you sure you want to delete this compliance report? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                isLoading={isActionLoading}
            />
        </div>
    );
}
