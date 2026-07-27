'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getVideos, createVideo, updateVideo, deleteVideo, Video, apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';

interface ModuleOption { id: string; title: string; }

export default function AdminVideosPage() {
 const { user, isAuthenticated, isLoading } = useAuth();
 const router = useRouter();
 const [videos, setVideos] = useState<Video[]>([]);
 const [modules, setModules] = useState<ModuleOption[]>([]);
 const [isFetching, setIsFetching] = useState(true);
 const [error, setError] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isCreateExpanded, setIsCreateExpanded] = useState(false);
 const [isActionLoading, setIsActionLoading] = useState(false);
 const [actionError, setActionError] = useState('');
 const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
 const [form, setForm] = useState({ module: '', video_url: '', duration: 0, order: 0 });
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [itemToDelete, setItemToDelete] = useState<string | null>(null);

 // Filter states
 const [selectedModules, setSelectedModules] = useState<string[]>([]);
 const [searchTerm, setSearchTerm] = useState('');

 useEffect(() => {
 if (!isLoading) {
 if (!isAuthenticated) router.push('/login');
 else if (user?.role !== 'super_admin' && user?.role !== 'org_admin' && user?.role !== 'course_provider') router.push('/dashboard');
 else {
 fetchVideos();
 fetchModules();
 }
 }
 }, [isAuthenticated, isLoading, user, router]);

 const fetchModules = async () => {
 const { data } = await apiFetch('/api/v1/modules/?page_size=100');
 if (data?.results) setModules(data.results);
 else if (Array.isArray(data)) setModules(data);
 };

 const fetchVideos = async () => {
 setIsFetching(true); setError('');
 const { data, error: e } = await getVideos();
 if (e) setError(e);
 else if (data?.results) setVideos(data.results);
 setIsFetching(false);
 };

 const openModal = (video: Video) => {
 setActionError('');
 setIsCreateExpanded(false);
 setSelectedVideo(video);
 setForm({
 module: video.module,
 video_url: video.video_url,
 duration: video.duration,
 order: video.order
 });
 setIsModalOpen(true);
 };

 const toggleCreate = () => {
 if (!isCreateExpanded) {
 setActionError('');
 setSelectedVideo(null);
 setForm({ 
 module: selectedModules.length === 1 ? selectedModules[0] : (modules.length > 0 ? modules[0].id : ''), 
 video_url: '', 
 duration: 0, 
 order: 0 
 });
 }
 setIsCreateExpanded(!isCreateExpanded);
 };

 const handleSubmit = async (ev: React.FormEvent) => {
 ev.preventDefault(); setActionError(''); setIsActionLoading(true);
 const isEditing = !!selectedVideo;
 const { error: apiErr } = isEditing
 ? await updateVideo(selectedVideo!.id, form)
 : await createVideo(form);

 if (apiErr) { setActionError(apiErr || 'Failed to save video.'); }
 else { 
 fetchVideos(); 
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
 const { error: e } = await deleteVideo(itemToDelete);
 if (e) setError(e || 'Failed to delete.');
 else fetchVideos();
 setIsDeleteModalOpen(false);
 setItemToDelete(null);
 setIsActionLoading(false);
 };

 if (isLoading || isFetching) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
 if (!user || (user.role !== 'super_admin' && user.role !== 'org_admin' && user.role !== 'course_provider')) return null;

 const filteredVideos = videos.filter(v => {
 const matchesModule = selectedModules.length === 0 || selectedModules.includes(v.module);
 const matchesSearch = !searchTerm || v.video_url.toLowerCase().includes(searchTerm.toLowerCase());
 return matchesModule && matchesSearch;
 });

 const getModuleName = (id: string) => modules.find(m => m.id === id)?.title || id;

 return (
 <div className="min-h-screen bg-muted pb-20">
 <div className="bg-card border-b border-border">
 <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-1">Videos Management</h1>
 <p className="text-muted-foreground">Add and manage training videos for modules.</p>
 </div>
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 flex flex-col lg:flex-row gap-8">
 {/* Sidebar Filter */}
 <div className="w-full lg:w-64 shrink-0">
 <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-6 sticky top-24">
 <div className="mb-6">
 <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Search</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
 <input
 type="text"
 placeholder="Search by video URL..."
 className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>

 <div className="mb-8 border-b border-border pb-2">
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Module</h3>
 <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
 {modules.map(module => (
 <label key={module.id} className="flex items-start gap-3 cursor-pointer group">
 <input
 type="checkbox"
 className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
 checked={selectedModules.includes(module.id)}
 onChange={() => {
 setSelectedModules(prev =>
 prev.includes(module.id) ? prev.filter(id => id !== module.id) : [...prev, module.id]
 );
 }}
 />
 <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{module.title}</span>
 </label>
 ))}
 </div>
 </div>

 {(selectedModules.length > 0 || searchTerm) && (
 <button
 onClick={() => { setSelectedModules([]); setSearchTerm(''); }}
 className="text-xs text-primary font-bold hover:text-primary transition-colors duration-200-hover transition-colors flex items-center gap-1 cursor-pointer"
 >
 ✕ Clear all filters
 </button>
 )}
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1">
 {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

 <ExpandableCreateSection
 title="Add New Video"
 isOpen={isCreateExpanded}
 onToggle={toggleCreate}
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Module <span className="text-red-500">*</span></label>
 <select
 className="block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card font-medium"
 value={form.module}
 onChange={e => setForm({ ...form, module: e.target.value })}
 required
 disabled={isActionLoading}
 >
 <option value="">Select Module</option>
 {modules.map(m => (
 <option key={m.id} value={m.id}>{m.title}</option>
 ))}
 </select>
 </div>
 <CloudinaryUpload
 label="Video File"
 resourceType="video"
 value={form.video_url}
 onUploadSuccess={(url) => setForm({ ...form, video_url: url })}
 className="mb-4"
 />
 <div className="grid grid-cols-2 gap-4">
 <Input label="Duration (seconds)" type="number" value={form.duration.toString()} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} required disabled={isActionLoading} />
 <Input label="Display Order" type="number" value={form.order.toString()} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} required disabled={isActionLoading} />
 </div>
 <div className="pt-4 flex justify-end gap-3">
 <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving...' : 'Add Video'}</Button>
 </div>
 </form>
 </ExpandableCreateSection>

 <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
 <table className="w-full text-left text-sm text-muted-foreground">
 <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
 <tr>
 <th className="px-6 py-4">Video URL</th>
 <th className="px-6 py-4">Module</th>
 <th className="px-6 py-4 text-center">Duration</th>
 <th className="px-6 py-4 text-center">Order</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredVideos.length === 0 ? (
 <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No videos found matching your criteria.</td></tr>
 ) : filteredVideos.map(v => (
 <tr key={v.id} className="hover:bg-muted transition-colors">
 <td className="px-6 py-4 font-medium text-foreground truncate max-w-[200px]">
 <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
 {v.video_url}
 </a>
 </td>
 <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{getModuleName(v.module)}</td>
 <td className="px-6 py-4 text-center">{v.duration} min</td>
 <td className="px-6 py-4 text-center">{v.order}</td>
 <td className="px-6 py-4 text-right whitespace-nowrap">
 <button onClick={() => openModal(v)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">Edit</button>
 <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer">Delete</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Video">
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Module <span className="text-red-500">*</span></label>
 <select
 className="block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card font-medium"
 value={form.module}
 onChange={e => setForm({ ...form, module: e.target.value })}
 required
 disabled={isActionLoading}
 >
 <option value="">Select Module</option>
 {modules.map(m => (
 <option key={m.id} value={m.id}>{m.title}</option>
 ))}
 </select>
 </div>
 <CloudinaryUpload
 label="Video File"
 resourceType="video"
 value={form.video_url}
 onUploadSuccess={(url) => setForm({ ...form, video_url: url })}
 className="mb-4"
 />
 <div className="grid grid-cols-2 gap-4">
 <Input label="Duration (seconds)" type="number" value={form.duration.toString()} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} required disabled={isActionLoading} />
 <Input label="Display Order" type="number" value={form.order.toString()} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} required disabled={isActionLoading} />
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
 title="Delete Video"
 message="Are you sure you want to delete this video? This action cannot be undone."
 confirmText="Delete"
 isLoading={isActionLoading}
 />
 </div>
 );
}
