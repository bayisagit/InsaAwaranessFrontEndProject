'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';

interface Alert {
    id: string;
    title: string;
    message: string;
    severity: string;
    status: string;
    notify_email: boolean;
    notify_sms: boolean;
    organization: string;
    published_at: string;
}

interface Organization {
    id: string;
    name: string;
}

const SELECT_CLS = "block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white";

export default function AdminAlertsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateExpanded, setIsCreateExpanded] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [form, setForm] = useState({
        title: '',
        message: '',
        severity: 'low',
        organization: '',
        notify_email: true,
        notify_sms: true
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        if (!isLoading && isAuthenticated && user?.role === 'super_admin') {
            fetchOrgs();
        }
    }, [isAuthenticated, isLoading, user]);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (user?.role !== 'super_admin') router.push('/dashboard');
            else fetchAlerts();
        }
    }, [isAuthenticated, isLoading, user, router, page, searchTerm]);

    const fetchOrgs = async () => {
        const { data } = await apiFetch('/api/v1/organizations/');
        if (data?.results) setOrgs(data.results);
        else if (Array.isArray(data)) setOrgs(data);
    };

    const fetchAlerts = async () => {
        setIsFetching(true); setError('');
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
            ordering: '-created_at'
        });
        if (searchTerm) params.set('search', searchTerm);
        const { data, error: e } = await apiFetch(`/api/v1/alerts/?${params.toString()}`);
        if (e) setError(e);
        else if (data?.results) {
            setAlerts(data.results);
            setTotalCount(data.count || 0);
        }
        else if (Array.isArray(data)) {
            setAlerts(data);
            setTotalCount(data.length);
        }
        setIsFetching(false);
    };

    const openModal = (alert: Alert) => {
        setActionError('');
        setIsCreateExpanded(false);
        setSelectedAlert(alert);
        setForm({
            title: alert.title || '',
            message: alert.message || '',
            severity: alert.severity || 'low',
            organization: alert.organization || '',
            notify_email: alert.notify_email ?? true,
            notify_sms: alert.notify_sms ?? true
        });
        setIsModalOpen(true);
    };

    const toggleCreate = () => {
        if (!isCreateExpanded) {
            setActionError('');
            setSelectedAlert(null);
            setForm({
                title: '',
                message: '',
                severity: 'low',
                organization: '',
                notify_email: true,
                notify_sms: true
            });
        }
        setIsCreateExpanded(!isCreateExpanded);
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault(); setActionError(''); setIsActionLoading(true);
        const isEditing = !!selectedAlert;
        const endpoint = `/api/v1/alerts/${isEditing ? `${selectedAlert!.id}/` : ''}`;
        const { error: apiErr, status } = await apiFetch(endpoint, { method: isEditing ? 'PATCH' : 'POST', body: JSON.stringify(form) });
        if (apiErr || (status !== 200 && status !== 201)) setActionError(apiErr || 'Failed to save.');
        else { 
            fetchAlerts(); 
            if (isEditing) {
                setIsModalOpen(false); 
            } else {
                setIsCreateExpanded(false);
            }
        }
        setIsActionLoading(false);
    };

    const handlePublish = async (id: string) => {
        setIsActionLoading(true);
        const { error: e, status } = await apiFetch(`/api/v1/alerts/${id}/publish/`, { method: 'POST' });
        if (e || status !== 200) setError(e || 'Failed to publish.');
        else fetchAlerts();
        setIsActionLoading(false);
    };

    const handleDelete = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        const { error: e, status } = await apiFetch(`/api/v1/alerts/${itemToDelete}/`, { method: 'DELETE' });
        if (e || status !== 204) setError(e || 'Failed to delete.');
        else fetchAlerts();
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setIsActionLoading(false);
    };

    if (isLoading || isFetching) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!user || user.role !== 'super_admin') return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Alerts Management</h1>
                        <p className="text-gray-500">Create and publish cybersecurity advisories.</p>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            placeholder="Search alerts by title or message..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <ExpandableCreateSection
                    title="Create Alert"
                    isOpen={isCreateExpanded}
                    onToggle={toggleCreate}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}
                        <Input label="Alert Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Organization</label>
                                <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} required disabled={isActionLoading}>
                                    <option value="" className="text-gray-900">Select Organization</option>
                                    {orgs.map(o => <option key={o.id} value={o.id} className="text-gray-900">{o.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Severity</label>
                                <select className={SELECT_CLS} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} disabled={isActionLoading}>
                                    <option value="low" className="text-gray-900">Low</option>
                                    <option value="medium" className="text-gray-900">Medium</option>
                                    <option value="high" className="text-gray-900">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-6 py-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.notify_email} onChange={e => setForm({ ...form, notify_email: e.target.checked })} disabled={isActionLoading} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                                <span className="text-sm text-gray-700 font-medium">Notify via Email</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.notify_sms} onChange={e => setForm({ ...form, notify_sms: e.target.checked })} disabled={isActionLoading} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                                <span className="text-sm text-gray-700 font-medium">Notify via SMS</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Message Content</label>
                            <textarea className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]" placeholder="Enter alert message details..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required disabled={isActionLoading} />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
                            <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving...' : 'Create Alert'}</Button>
                        </div>
                    </form>
                </ExpandableCreateSection>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Severity / Status</th>
                                <th className="px-6 py-4">Title / Message</th>
                                <th className="px-6 py-4">Published</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {alerts.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No alerts yet.</td></tr>
                            ) : alerts.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest w-fit ${a.severity === 'high' ? 'bg-red-50 text-red-700' :
                                                a.severity === 'medium' ? 'bg-orange-50 text-orange-700' :
                                                    'bg-blue-50 text-blue-700'
                                                }`}>
                                                {a.severity}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest w-fit ${a.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {a.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{a.title}</div>
                                        <div className="text-gray-500 truncate max-w-sm">{a.message}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                                        {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Not published'}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        {a.status !== 'published' && (
                                            <button onClick={() => handlePublish(a.id)} className="text-green-600 hover:text-green-800 font-medium mr-3 transition-colors">Publish</button>
                                        )}
                                        <button onClick={() => openModal(a)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md text-xs font-bold transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalCount > pageSize && (
                    <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                        <span className="text-sm text-gray-500">Showing {alerts.length} of {totalCount} alerts</span>
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
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Alert">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}
                    <Input label="Alert Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Organization</label>
                            <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} required disabled={isActionLoading}>
                                <option value="" className="text-gray-900">Select Organization</option>
                                {orgs.map(o => <option key={o.id} value={o.id} className="text-gray-900">{o.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Severity</label>
                            <select className={SELECT_CLS} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} disabled={isActionLoading}>
                                <option value="low" className="text-gray-900">Low</option>
                                <option value="medium" className="text-gray-900">Medium</option>
                                <option value="high" className="text-gray-900">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-6 py-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.notify_email} onChange={e => setForm({ ...form, notify_email: e.target.checked })} disabled={isActionLoading} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                            <span className="text-sm text-gray-700 font-medium">Notify via Email</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.notify_sms} onChange={e => setForm({ ...form, notify_sms: e.target.checked })} disabled={isActionLoading} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                            <span className="text-sm text-gray-700 font-medium">Notify via SMS</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Message Content</label>
                        <textarea className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]" placeholder="Enter alert message details..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required disabled={isActionLoading} />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Alert"
                message="Are you sure you want to delete this alert? This action cannot be undone."
                confirmText="Delete"
                isLoading={isActionLoading}
            />
        </div>
    );
}
