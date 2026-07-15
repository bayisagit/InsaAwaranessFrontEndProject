'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getResources, createResource, updateResource, deleteResource, publishResource, Resource, getOrganizations, apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { toast } from 'react-hot-toast';

const SELECT_CLS = "block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white font-medium";

interface OrgOption { id: string; name: string; }

export default function AdminResourcesPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [resources, setResources] = useState<Resource[]>([]);
    const [orgs, setOrgs] = useState<OrgOption[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;
    const [isModalOpen, setIsModalOpen] = useState(false); // For Add/Edit Resource
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

    // Filter states
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [filterSearchTerm, setFilterSearchTerm] = useState(''); // For sidebar search

    const [form, setForm] = useState<{
        organization: string;
        title: string;
        content: string;
        file_url: string;
        category: string;
        audience: string;
        status: 'draft' | 'published';
    }>({ organization: '', title: '', content: '', file_url: '', category: '', audience: '', status: 'draft' });

    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        variant: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        onConfirm: () => { },
        variant: 'danger'
    });

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (user?.role !== 'super_admin' && user?.role !== 'course_provider') router.push('/admin');
            else {
                fetchResources();
                fetchOrgs();
            }
        }
    }, [isAuthenticated, isLoading, user, router, page]);

    const fetchOrgs = async () => {
        const { data } = await getOrganizations({ page_size: 100 });
        let fetchedOrgs: OrgOption[] = [];
        if (data?.results) fetchedOrgs = data.results;
        else if (Array.isArray(data)) fetchedOrgs = data;

        setOrgs(fetchedOrgs);

        // Auto-select if only one org exists
        if (fetchedOrgs.length === 1 && !form.organization) {
            setForm(prev => ({ ...prev, organization: fetchedOrgs[0].id }));
        }
    };

    const fetchResources = async () => {
        setIsFetching(true); setError('');
        try {
            const searchParams = new URLSearchParams({
                page: page.toString(),
                page_size: pageSize.toString(),
                search: searchTerm,
                ordering: '-created_at'
            });

            const url = `/api/v1/resources/?${searchParams.toString()}`;

            const { data, error: e, status } = await apiFetch(url);

            if (e) {
                setError(e);
            }
            else if (data?.results) {
                setResources(data.results);
                setTotalCount(data.count || 0);
            }
            else if (Array.isArray(data)) {
                setResources(data);
                setTotalCount(data.length);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsFetching(false);
        }
    };

    const openModal = (res?: Resource) => {
        setActionError('');
        if (res) {
            setSelectedResource(res);
            setForm({
                organization: res.organization,
                title: res.title,
                content: res.content,
                file_url: res.file_url,
                category: res.category,
                audience: res.audience,
                status: res.status
            });
        } else {
            setSelectedResource(null);
            setForm({ organization: '', title: '', content: '', file_url: '', category: '', audience: '', status: 'draft' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault(); setActionError(''); setIsActionLoading(true);

        if (!form.organization) {
            setActionError('Please select an organization.');
            setIsActionLoading(false);
            return;
        }

        const isEditing = !!selectedResource;
        const { data, error: apiErr, status } = isEditing
            ? await updateResource(selectedResource!.id, form)
            : await createResource(form);

        if (apiErr || (status !== 200 && status !== 201)) {
            const msg = apiErr || 'Failed to save resource.';
            setActionError(msg);
            toast.error(msg);
        }
        else {
            toast.success(selectedResource ? 'Resource updated successfully!' : 'Resource created successfully!');
            fetchResources();
            setIsModalOpen(false);
        }
        setIsActionLoading(false);
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Resource',
            message: 'Are you sure you want to delete this resource? This action cannot be undone.',
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                setIsActionLoading(true);
                const { error: e } = await deleteResource(id);
                if (e) setError(e || 'Failed to delete.');
                else fetchResources();
                setIsActionLoading(false);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handlePublish = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Publish Resource',
            message: 'Are you sure you want to publish this resource? It will be visible to its target audience.',
            confirmText: 'Publish',
            variant: 'info',
            onConfirm: async () => {
                setIsActionLoading(true);
                const { error: e } = await publishResource(id, {});
                if (e) setError(e || 'Failed to publish.');
                else fetchResources();
                setIsActionLoading(false);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!user || (user.role !== 'super_admin' && user.role !== 'course_provider')) return null;

    const filteredResources = resources.filter(r => {
        const matchesOrg = selectedOrgs.length === 0 || selectedOrgs.includes(r.organization);
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(r.status);
        const matchesSearch = !filterSearchTerm ||
            r.title.toLowerCase().includes(filterSearchTerm.toLowerCase()) ||
            r.category.toLowerCase().includes(filterSearchTerm.toLowerCase());
        return matchesOrg && matchesStatus && matchesSearch;
    });

    const getOrgName = (id: string) => orgs.find(o => o.id === id)?.name || id;
    const canPublish = user.role === 'super_admin';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Resources Management</h1>
                        <p className="text-gray-500">Manage and publish learning resources.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => fetchResources()}>Refresh</Button>
                        <Button variant="primary" onClick={() => openModal()}>Add Resource</Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filter */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Title or category..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={filterSearchTerm}
                                    onChange={(e) => setFilterSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Organization</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {orgs.map(org => (
                                    <label key={org.id} className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={selectedOrgs.includes(org.id)}
                                            onChange={() => {
                                                setSelectedOrgs(prev =>
                                                    prev.includes(org.id) ? prev.filter(id => id !== org.id) : [...prev, org.id]
                                                );
                                            }}
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">{org.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Status</h3>
                            <div className="space-y-2">
                                {['draft', 'published'].map(status => (
                                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={selectedStatuses.includes(status)}
                                            onChange={() => {
                                                setSelectedStatuses(prev =>
                                                    prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                                                );
                                            }}
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors capitalize">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {(selectedOrgs.length > 0 || selectedStatuses.length > 0 || filterSearchTerm) && (
                            <button
                                onClick={() => { setSelectedOrgs([]); setSelectedStatuses([]); setFilterSearchTerm(''); }}
                                className="text-xs text-primary font-bold hover:text-primary-hover transition-colors flex items-center gap-1"
                            >
                                ✕ Clear all filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                    {/* Filters - Removed as they are now in the sidebar */}
                    {/* <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <Input
                                placeholder="Search resources by title or category..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div> */}

                    <div className="relative">
                        {isFetching && (
                            <div className="absolute inset-0 bg-white/60 z-10 flex items-start justify-center pt-16 rounded-xl">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Org</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredResources.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No resources found matching your criteria.</td></tr>
                                    ) : filteredResources.map(r => (
                                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{r.title}</td>
                                            <td className="px-6 py-4 text-gray-600 capitalize">{r.category}</td>
                                            <td className="px-6 py-4 truncate max-w-[150px]">{getOrgName(r.organization)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${r.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                                                    }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                {r.status === 'draft' && canPublish && (
                                                    <button onClick={() => handlePublish(r.id)} className="text-green-600 hover:text-green-800 font-medium mr-3 transition-colors">Publish</button>
                                                )}
                                                <button onClick={() => openModal(r)} className="text-secondary hover:text-primary font-medium mr-3 transition-colors">Edit</button>
                                                <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalCount > pageSize && !selectedOrgs.length && !selectedStatuses.length && !filterSearchTerm && (
                            <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                                <span className="text-sm text-gray-500">Showing {resources.length} of {totalCount} resources</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page <= 1 || isFetching}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(page * pageSize) >= totalCount || isFetching}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedResource ? 'Edit Resource' : 'Add Resource'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} />
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
                            <select
                                className={SELECT_CLS}
                                value={form.organization}
                                onChange={e => setForm({ ...form, organization: e.target.value })}
                                required
                                disabled={isActionLoading}
                            >
                                <option value="">Select Organization</option>
                                {orgs.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
                        <textarea className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] resize-y" placeholder="Enter resource description or content..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} disabled={isActionLoading} />
                    </div>
                    <CloudinaryUpload
                        label="Resource File"
                        resourceType="auto"
                        value={form.file_url}
                        onUploadSuccess={(url) => setForm({ ...form, file_url: url })}
                        className="mb-4"
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required disabled={isActionLoading} />
                        <Input label="Audience" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} required disabled={isActionLoading} />
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                            <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} disabled={isActionLoading}>
                                <option value="draft">Draft</option>
                                {canPublish && <option value="published">Published</option>}
                            </select>
                            {!canPublish && <p className="text-[10px] text-gray-500 mt-1">Contact admin for publishing.</p>}
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving...' : selectedResource ? 'Save Changes' : 'Add Resource'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                variant={confirmConfig.variant}
                isLoading={isActionLoading}
            />
        </div>
    );
}
