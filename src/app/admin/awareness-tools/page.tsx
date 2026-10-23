'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
 getAwarenessTools,
 createAwarenessTool,
 updateAwarenessTool,
 deleteAwarenessTool,
 toggleAwarenessToolStatus,
 AwarenessTool
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';
import { ToolConfigBuilder } from '@/components/builders/ToolConfigBuilder';
import Link from 'next/link';

export default function AdminAwarenessToolsPage() {
 const { user, isAuthenticated, isLoading } = useAuth();
 const router = useRouter();
 const [tools, setTools] = useState<AwarenessTool[]>([]);
 const [isFetching, setIsFetching] = useState(true);
 const [error, setError] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isCreateExpanded, setIsCreateExpanded] = useState(false);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [selectedTool, setSelectedTool] = useState<AwarenessTool | null>(null);
 const [isActionLoading, setIsActionLoading] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [page, setPage] = useState(1);
 const [totalCount, setTotalCount] = useState(0);
 const pageSize = 10;

 const [formData, setFormData] = useState<{
  name: string;
  description: string;
  status: 'enabled' | 'disabled';
  config: Record<string, any>;
 }>({
  name: '',
  description: '',
  status: 'enabled',
  config: {}
 });

 useEffect(() => {
 if (!isLoading) {
 if (!isAuthenticated) router.push('/login');
 else if (user?.role !== 'super_admin') router.push('/dashboard');
 else fetchTools();
 }
 }, [isAuthenticated, isLoading, user, router, page, searchTerm]);

 const fetchTools = async () => {
 setIsFetching(true);
 const params: Record<string, any> = {
 page: page.toString(),
 page_size: pageSize.toString()
 };
 if (searchTerm) params.search = searchTerm;
 const { data, error: e } = await getAwarenessTools(params);
 if (e) setError(e);
 else if (data?.results) {
 setTools(data.results);
 setTotalCount(data.count || 0);
 }
 setIsFetching(false);
 };

 const handleOpenModal = (tool: AwarenessTool) => {
  setIsCreateExpanded(false);
  setSelectedTool(tool);
  setFormData({
   name: tool.name,
   description: tool.description,
   status: tool.status,
   config: tool.config || {}
  });
  setIsModalOpen(true);
 };

 const toggleCreate = () => {
  if (!isCreateExpanded) {
   setSelectedTool(null);
   setFormData({
    name: '',
    description: '',
    status: 'enabled',
    config: {}
   });
   setError('');
  }
  setIsCreateExpanded(!isCreateExpanded);
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsActionLoading(true);
  setError('');

  const payload = {
   name: formData.name,
   description: formData.description,
   status: formData.status,
   config: typeof formData.config === 'object' ? formData.config : {}
  };

  const { error: err } = selectedTool
   ? await updateAwarenessTool(selectedTool.id, payload)
   : await createAwarenessTool(payload);

  if (err) {
   setError(err);
   setIsActionLoading(false);
  } else {
   if (selectedTool) {
    setIsModalOpen(false);
   } else {
    setIsCreateExpanded(false);
   }
   fetchTools();
   setIsActionLoading(false);
  }
 };

 const handleToggleStatus = async (tool: AwarenessTool) => {
 setIsActionLoading(true);
 const newStatus = tool.status === 'enabled' ? 'disabled' : 'enabled';
 const { error: err } = await toggleAwarenessToolStatus(tool.id, { status: newStatus });
 if (err) setError(err);
 else fetchTools();
 setIsActionLoading(false);
 };

 const handleDelete = async () => {
 if (!selectedTool) return;
 setIsActionLoading(true);
 const { error: e } = await deleteAwarenessTool(selectedTool.id);
 if (e) setError(e);
 else {
 setIsDeleteModalOpen(false);
 fetchTools();
 }
 setIsActionLoading(false);
 };

 if (isLoading || isFetching) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

 return (
 <div className="min-h-screen bg-muted pb-20">
 <div className="bg-card border-b border-border">
 <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-1">Awareness Tools</h1>
 <p className="text-muted-foreground">Manage interactive cybersecurity awareness tools and simulations.</p>
 </div>
 <div className="flex gap-3">
 <Link href="/admin/awareness-tools/usage">
 <Button variant="outline">View Usage Logs</Button>
 </Link>
 </div>
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
 {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

 <div className="flex flex-col md:flex-row gap-4 mb-6">
 <div className="flex-1">
 <Input
 placeholder="Search tools by name or description..."
 value={searchTerm}
 onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
 />
 </div>
 </div>

 <ExpandableCreateSection
 title="Add New Tool"
 isOpen={isCreateExpanded}
 onToggle={toggleCreate}
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 <Input
 label="Tool Name"
 placeholder="e.g. Phishing Simulation"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 required
 autoFocus
 />
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 min-h-[100px]"
 placeholder="Briefly describe what this tool does..."
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 required
 />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1.5">Status</label>
 <select
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
 value={formData.status}
 onChange={(e) => setFormData({ ...formData, status: e.target.value as 'enabled' | 'disabled' })}
 >
 <option value="enabled">Enabled</option>
 <option value="disabled">Disabled</option>
 </select>
 </div>
 <div className="pt-2">
 <div className="text-sm font-semibold text-foreground mb-2">Tool Configuration & Interactive Features</div>
 <ToolConfigBuilder
  key={isCreateExpanded ? "new-tool-active" : "new-tool-idle"}
  initialConfig={formData.config}
  onChange={(newConfig) => setFormData(prev => ({ ...prev, config: newConfig }))}
  toolName={formData.name}
 />
 </div>
 <div className="pt-4 flex flex-wrap justify-end gap-3 min-w-fit">
 <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>
 {isActionLoading ? 'Saving...' : 'Create Tool'}
 </Button>
 </div>
 </form>
 </ExpandableCreateSection>

 <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm shadow-black/5 dark:shadow-none">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted border-b border-border">
 <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Tool Name</th>
 <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Description</th>
 <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
 <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Usage</th>
 <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {tools.length === 0 ? (
 <tr>
 <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
 No awareness tools found. Start by adding one.
 </td>
 </tr>
 ) : tools.map((tool) => (
 <tr key={tool.id} className="hover:bg-muted transition-colors">
 <td className="px-6 py-4">
 <p className="font-bold text-foreground">{tool.name}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm text-muted-foreground line-clamp-1">{tool.description}</p>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
    tool.status === 'enabled' 
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
      : 'bg-muted/60 text-muted-foreground border-border'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${tool.status === 'enabled' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
    {tool.status}
 </span>
 </td>
 <td className="px-6 py-4 text-center">
 <p className="text-sm font-semibold text-foreground">{tool.usage_count || 0}</p>
 </td>
 <td className="px-6 py-4 text-right whitespace-nowrap">
 <div className="flex items-center justify-end gap-2">
 <button
    onClick={() => handleToggleStatus(tool)}
    className="px-2.5 py-1 bg-muted/60 hover:bg-muted text-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer"
  >
    {tool.status === 'enabled' ? 'Disable' : 'Enable'}
  </button>
  <button
    onClick={() => handleOpenModal(tool)}
    className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
  >
    Edit
  </button>
  <button
    onClick={() => { setSelectedTool(tool); setIsDeleteModalOpen(true); }}
    className="px-2.5 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
  >
    Delete
  </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {totalCount > pageSize && (
 <div className="mt-6 flex justify-between items-center bg-card p-4 rounded-xl border border-border">
 <span className="text-sm text-muted-foreground">Showing {tools.length} of {totalCount} tools</span>
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

 <Modal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title="Edit Awareness Tool"
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 <Input
 label="Tool Name"
 placeholder="e.g. Phishing Simulation"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 required
 autoFocus
 />
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 min-h-[100px]"
 placeholder="Briefly describe what this tool does..."
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 required
 />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1.5">Status</label>
 <select
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
 value={formData.status}
 onChange={(e) => setFormData({ ...formData, status: e.target.value as 'enabled' | 'disabled' })}
 >
 <option value="enabled">Enabled</option>
 <option value="disabled">Disabled</option>
 </select>
 </div>
 <div className="pt-2">
 <div className="text-sm font-semibold text-foreground mb-2">Tool Configuration & Interactive Features</div>
 <ToolConfigBuilder
  key={selectedTool?.id || "edit-tool"}
  initialConfig={formData.config}
  onChange={(newConfig) => setFormData(prev => ({ ...prev, config: newConfig }))}
  toolName={formData.name}
 />
 </div>
 <div className="pt-4 flex flex-wrap justify-end gap-3 min-w-fit">
 <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>
 {isActionLoading ? 'Saving...' : 'Update Tool'}
 </Button>
 </div>
 </form>
 </Modal>

 <ConfirmModal
 isOpen={isDeleteModalOpen}
 onClose={() => setIsDeleteModalOpen(false)}
 onConfirm={handleDelete}
 title="Delete Awareness Tool"
 message={`Are you sure you want to delete "${selectedTool?.name}"? This action cannot be undone.`}
 confirmText="Delete"
 variant="danger"
 />
 </div>
 );
}
