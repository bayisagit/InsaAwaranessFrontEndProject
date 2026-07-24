'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    getOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    Organization,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 15;

export default function AdminOrganizationsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateExpanded, setIsCreateExpanded] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [form, setForm] = useState({ name: '', description: '' });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchOrgs = useCallback(async (p = page, q = searchTerm) => {
        setIsFetching(true);
        setError('');
        const params: Record<string, any> = { page: p, page_size: PAGE_SIZE };
        if (q.trim()) params.search = q.trim();

        const { data, error: e } = await getOrganizations(params);
        if (e) { setError(e); }
        else if (data) {
            setOrgs(data.results);
            setTotalCount(data.count);
        }
        setIsFetching(false);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (user?.role !== 'super_admin') router.push('/dashboard');
            else fetchOrgs(page, searchTerm);
        }
    }, [isAuthenticated, isLoading, user, router, page]);

    // Debounced search
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchOrgs(1, value);
        }, 300);
    };

    const openModal = (org: Organization) => {
        setActionError('');
        setIsCreateExpanded(false);
        setSelectedOrg(org);
        setForm({ name: org.name, description: org.description || '' });
        setIsModalOpen(true);
    };

    const toggleCreate = () => {
        if (!isCreateExpanded) {
            setActionError('');
            setSelectedOrg(null);
            setForm({ name: '', description: '' });
        }
        setIsCreateExpanded(!isCreateExpanded);
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setActionError('');
        setIsActionLoading(true);

        if (!form.name.trim()) {
            setActionError('Organization name is required.');
            setIsActionLoading(false);
            return;
        }

        const payload = { name: form.name.trim(), description: form.description.trim() };

        const { error: apiErr, status } = selectedOrg
            ? await updateOrganization(selectedOrg.id, payload)
            : await createOrganization(payload);

        if (apiErr || (status !== 200 && status !== 201)) {
            setActionError(apiErr || 'Failed to save organization.');
        } else {
            toast.success(selectedOrg ? 'Organization updated.' : 'Organization created.');
            if (selectedOrg) {
                setIsModalOpen(false);
            } else {
                setIsCreateExpanded(false);
            }
            fetchOrgs(page, searchTerm);
        }
        setIsActionLoading(false);
    };

    const handleDelete = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        const { error: e, status } = await deleteOrganization(itemToDelete);
        if (e || status !== 204) {
            toast.error(e || 'Failed to delete.');
        } else {
            toast.success('Organization deleted.');
            fetchOrgs(page, searchTerm);
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setIsActionLoading(false);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
    );
    if (!user || user.role !== 'super_admin') return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Page header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Organizations</h1>
                        <p className="text-gray-500">
                            {totalCount > 0 ? `${totalCount} organization${totalCount !== 1 ? 's' : ''} registered` : 'Manage organizations on the platform.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-8">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                {/* Search */}
                <div className="mb-5 max-w-sm">
                    <Input
                        placeholder="Search organizations…"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>

                <ExpandableCreateSection
                    title="Add Organization"
                    isOpen={isCreateExpanded}
                    onToggle={toggleCreate}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {actionError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>
                        )}
                        <Input
                            label="Organization Name"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            required
                            disabled={isActionLoading}
                            placeholder="e.g., INSA Federal Agency"
                            autoFocus
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                            <textarea
                                className="block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white resize-none min-h-[80px]"
                                placeholder="Brief description of this organization's purpose…"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                disabled={isActionLoading}
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={isActionLoading}>
                                {isActionLoading ? 'Saving…' : 'Create Organization'}
                            </Button>
                        </div>
                    </form>
                </ExpandableCreateSection>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4 hidden md:table-cell">Description</th>
                                <th className="px-6 py-4 hidden lg:table-cell">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isFetching ? (
                                /* Skeleton rows */
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {[1, 2, 3, 4].map(j => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : orgs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="text-4xl mb-3">🏢</div>
                                        <p className="font-medium text-gray-700">No organizations found</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {searchTerm ? 'Try a different search term.' : 'Create the first organization above.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : orgs.map(o => (
                                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900">{o.name}</td>
                                    <td className="px-6 py-4 text-gray-500 max-w-xs hidden md:table-cell">
                                        <span className="line-clamp-1">{o.description || <span className="italic text-gray-300">No description</span>}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400 hidden lg:table-cell">
                                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button
                                            onClick={() => openModal(o)}
                                            className="text-secondary hover:text-primary font-medium mr-4 transition-colors text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(o.id)}
                                            className="text-red-500 hover:text-red-700 font-medium transition-colors text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-5 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                        <span className="text-sm text-gray-500">
                            Page {page} of {totalPages} · {totalCount} total
                        </span>
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

            {/* Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Edit Organization"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {actionError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>
                    )}
                    <Input
                        label="Organization Name"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                        disabled={isActionLoading}
                        placeholder="e.g., INSA Federal Agency"
                        autoFocus
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                        <textarea
                            className="block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white resize-none min-h-[80px]"
                            placeholder="Brief description of this organization's purpose…"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            disabled={isActionLoading}
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>
                            {isActionLoading ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Organization"
                message="Are you sure you want to delete this organization? Linked memberships and training requests will become inaccessible."
                confirmText="Delete"
                isLoading={isActionLoading}
            />
        </div>
    );
}
