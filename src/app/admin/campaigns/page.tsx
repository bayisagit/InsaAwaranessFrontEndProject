'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch, getCampaigns, Campaign } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';

interface Organization {
 id: string;
 name: string;
}

const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card";

export default function AdminCampaignsPage() {
 const { user, isAuthenticated, isLoading } = useAuth();
 const router = useRouter();
 const [camps, setCamps] = useState<Campaign[]>([]);
 const [isFetching, setIsFetching] = useState(true);
 const [error, setError] = useState('');
 const [searchTerm, setSearchTerm] = useState('');
 const [page, setPage] = useState(1);
 const [totalCount, setTotalCount] = useState(0);
 const [pageSize, setPageSize] = useState(10);

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isCreateExpanded, setIsCreateExpanded] = useState(false);
 const [isActionLoading, setIsActionLoading] = useState(false);
 const [actionError, setActionError] = useState('');
 const [selected, setSelected] = useState<Campaign | null>(null);
 const [orgs, setOrgs] = useState<Organization[]>([]);
 const [form, setForm] = useState({ organization: '', title: '', message: '', start_date: '', send_time: '', channels: '', status: 'draft' });
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [itemToDelete, setItemToDelete] = useState<string | null>(null);

 useEffect(() => {
 if (!isLoading && isAuthenticated && (user?.role === 'super_admin' || user?.role === 'org_admin')) {
 fetchOrgs();
 }
 }, [isAuthenticated, isLoading, user]);

 useEffect(() => {
 if (!isLoading) {
 if (!isAuthenticated) router.push('/login');
 else if (user?.role !== 'super_admin' && user?.role !== 'org_admin') router.push('/dashboard');
 else fetchAll();
 }
 }, [isAuthenticated, isLoading, user, router, page]);

 const fetchOrgs = async () => {
 const { data } = await apiFetch('/api/v1/organizations/');
 if (data?.results) setOrgs(data.results);
 else if (Array.isArray(data)) setOrgs(data);
 };

 const fetchAll = async () => {
 setIsFetching(true); setError('');
 const query = new URLSearchParams({
 page: page.toString(),
 page_size: pageSize.toString(),
 search: searchTerm,
 ordering: '-start_date'
 }).toString();
 const { data, error: e } = await getCampaigns({
 page: page.toString(),
 page_size: pageSize.toString(),
 search: searchTerm,
 ordering: '-start_date'
 });
 if (e) setError(e);
 else if (data?.results) {
 setCamps(data.results);
 // console.log(data.results)
 setTotalCount(data.count || 0);
 }
 else if (Array.isArray(data)) {
 setCamps(data);
 setTotalCount(data.length);
 }
 setIsFetching(false);
 };

 const openModal = (item: Campaign) => {
 setActionError('');
 setIsCreateExpanded(false);
 setSelected(item);
 setForm({
 organization: item.organization || '',
 title: item.title,
 message: item.message,
 start_date: item.start_date.split('T')[0],
 send_time: item.send_time ? (item.send_time.includes('T') ? item.send_time.split('T')[1].substring(0, 5) : item.send_time.substring(0, 5)) : '',
 channels: Array.isArray(item.channels) ? item.channels.join(', ') : item.channels || '',
 status: item.status || 'draft'
 });
 setIsModalOpen(true);
 };

 const toggleCreate = () => {
 if (!isCreateExpanded) {
 setActionError('');
 setSelected(null);
 setForm({ organization: '', title: '', message: '', start_date: '', send_time: '', channels: '', status: 'draft' });
 }
 setIsCreateExpanded(!isCreateExpanded);
 };

 const handleSubmit = async (ev: React.FormEvent) => {
 ev.preventDefault(); setActionError(''); setIsActionLoading(true);
 const isEditing = !!selected;
 const endpoint = `/api/v1/campaigns/${isEditing ? `${selected!.id}/` : ''}`;
 const payload = {
 ...form,
 channels: form.channels.split(',').map(c => c.trim()).filter(Boolean)
 };
 const { error: apiErr, status } = await apiFetch(endpoint, { method: isEditing ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
 if (apiErr || (status !== 200 && status !== 201)) setActionError(apiErr || 'Failed to save.');
 else { 
 fetchAll(); 
 if (isEditing) {
 setIsModalOpen(false); 
 } else {
 setIsCreateExpanded(false);
 }
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
 const { error: e, status } = await apiFetch(`/api/v1/campaigns/${itemToDelete}/`, { method: 'DELETE' });
 if (e || status !== 204) setError(e || 'Failed to delete.');
 else fetchAll();
 setIsDeleteModalOpen(false);
 setItemToDelete(null);
 setIsActionLoading(false);
 };

 if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><div aria-label="Loading" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
 if (!user || (user.role !== 'super_admin' && user.role !== 'org_admin')) return null;

 return (
 <div className="min-h-screen bg-muted pb-20">
 <PageHeader
 title="Campaigns Management"
 description="Manage national cybersecurity awareness campaigns."
 />
 <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
 {error && <div role="alert" className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

 <div className="flex flex-col md:flex-row gap-4 mb-6">
 <div className="flex-1">
 <Input
 placeholder="Search campaigns by title or message..."
 value={searchTerm}
 onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
 />
 </div>
 </div>

 <ExpandableCreateSection
 title="Add New Campaign"
 isOpen={isCreateExpanded}
 onToggle={toggleCreate}
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}
 <Input label="Campaign Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

 <div className="grid grid-cols-2 gap-4">
 {user?.role === 'org_admin' ? (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Organization</label>
 <div className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-muted-foreground font-medium text-sm">
 {user.organization_name || 'Your Organization'}
 </div>
 </div>
 ) : (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Organization</label>
 <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} required disabled={isActionLoading}>
 <option value="" className="text-foreground">Select Organization</option>
 {orgs.map(o => <option key={o.id} value={o.id} className="text-foreground">{o.name}</option>)}
 </select>
 </div>
 )}
 <Input label="Channels (comma-separated)" placeholder="e.g. email, sms" value={form.channels} onChange={e => setForm({ ...form, channels: e.target.value })} required disabled={isActionLoading} />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required disabled={isActionLoading} />
 <Input label="Send Time" type="time" value={form.send_time} onChange={e => setForm({ ...form, send_time: e.target.value })} required disabled={isActionLoading} />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Status</label>
 <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isActionLoading}>
 <option value="draft" className="text-foreground">Draft</option>
 <option value="scheduled" className="text-foreground">Scheduled</option>
 <option value="live" className="text-foreground">Live</option>
 <option value="completed" className="text-foreground">Completed</option>
 <option value="cancelled" className="text-foreground">Cancelled</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Campaign Message</label>
 <textarea className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]" placeholder="Enter campaign message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required disabled={isActionLoading} />
 </div>
 <div className="pt-4 flex justify-end gap-3">
 <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving...' : 'Create Campaign'}</Button>
 </div>
 </form>
 </ExpandableCreateSection>

 <div className="relative">
 {isFetching && (
 <div className="absolute inset-0 bg-white/60 z-10 flex items-start justify-center pt-16 rounded-xl">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
 </div>
 )}
 <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
 <table className="w-full text-left text-sm text-muted-foreground">
 <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
 <tr>
 <th className="px-6 py-4">Title</th>
 <th className="px-6 py-4">Timeline</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {camps.length === 0 ? (
 <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No campaigns yet.</td></tr>
 ) : camps.map(c => (
 <tr key={c.id} className="hover:bg-muted transition-colors">
 <td className="px-6 py-4">
 <div className="font-medium text-foreground">{c.title}</div>
 <div className="text-muted-foreground truncate max-w-sm">{c.message}</div>
 </td>
 <td className="px-6 py-4 text-xs">
 {new Date(c.start_date).toLocaleDateString()}
 </td>
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.status === 'live' ? 'bg-green-50 text-green-700' :
 c.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
 c.status === 'cancelled' ? 'bg-red-50 text-red-700' :
 'bg-muted/50 text-muted-foreground'
 }`}>
 {c.status}
 </span>
 </td>
 <td className="px-6 py-4 text-right whitespace-nowrap">
 <button onClick={() => openModal(c)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">Edit</button>
 <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer">Delete</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 <div className="mt-6">
 <Pagination
 page={page}
 pageSize={pageSize}
 totalCount={totalCount}
 isLoading={isFetching}
 onPageChange={setPage}
 label="campaigns"
 />
 </div>
 </div>
 </div>
 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Campaign">
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}
 <Input label="Campaign Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

 <div className="grid grid-cols-2 gap-4">
 {user?.role === 'org_admin' ? (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Organization</label>
 <div className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-muted-foreground font-medium text-sm">
 {user.organization_name || 'Your Organization'}
 </div>
 </div>
 ) : (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Organization</label>
 <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} required disabled={isActionLoading}>
 <option value="" className="text-foreground">Select Organization</option>
 {orgs.map(o => <option key={o.id} value={o.id} className="text-foreground">{o.name}</option>)}
 </select>
 </div>
 )}
 <Input label="Channels (comma-separated)" placeholder="e.g. email, sms" value={form.channels} onChange={e => setForm({ ...form, channels: e.target.value })} required disabled={isActionLoading} />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required disabled={isActionLoading} />
 <Input label="Send Time" type="time" value={form.send_time} onChange={e => setForm({ ...form, send_time: e.target.value })} required disabled={isActionLoading} />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Status</label>
 <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isActionLoading}>
 <option value="draft" className="text-foreground">Draft</option>
 <option value="scheduled" className="text-foreground">Scheduled</option>
 <option value="live" className="text-foreground">Live</option>
 <option value="completed" className="text-foreground">Completed</option>
 <option value="cancelled" className="text-foreground">Cancelled</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Campaign Message</label>
 <textarea className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]" placeholder="Enter campaign message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required disabled={isActionLoading} />
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
 title="Delete Campaign"
 message="Are you sure you want to delete this campaign? This action cannot be undone."
 confirmText="Delete"
 isLoading={isActionLoading}
 />
 </div>
 );
}
