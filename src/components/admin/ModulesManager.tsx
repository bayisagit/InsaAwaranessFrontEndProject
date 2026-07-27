'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';

interface Module {
 id: string;
 course: string;
 title: string;
 order: number;
}


interface Course {
 id: string;
 title: string;
}

const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card";

export function ModulesManager({ lockedCourseId }: { lockedCourseId?: string }) {
 const { user, isAuthenticated, isLoading } = useAuth();
 const router = useRouter();

 const [modules, setModules] = useState<Module[]>([]);
 const [courses, setCourses] = useState<Course[]>([]);
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
 const [selectedModule, setSelectedModule] = useState<Module | null>(null);

 const [createdModuleId, setCreatedModuleId] = useState<string | null>(null);
 const [urlContext, setUrlContext] = useState<{ courseId?: string; isLocked: boolean }>({ isLocked: false });

 const [form, setForm] = useState({
 course: '',
 title: '',
 order: 0
 });


 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [itemToDelete, setItemToDelete] = useState<string | null>(null);

 // Filtering states
 const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

 useEffect(() => {
 if (!isLoading) {
 if (!isAuthenticated) router.push('/login');
 else if (user?.role !== 'super_admin' && user?.role !== 'course_provider' && user?.role !== 'org_admin') router.push('/dashboard');
 else {
 fetchCourses();
 fetchModules();
 }
 }
 }, [isAuthenticated, isLoading, user, router, page]);

 // Handle URL parameters for continuous creation workflow
 useEffect(() => {
 if (typeof window !== 'undefined') {
 const params = new URLSearchParams(window.location.search);
 const create = params.get('create');
 const courseId = params.get('courseId');
 
 if (create === 'true') {
 setIsCreateExpanded(true);
 if (courseId && !lockedCourseId) {
 setUrlContext({ courseId, isLocked: true });
 setForm(prev => ({ ...prev, course: courseId }));
 }
 }
 }
 
 // If lockedCourseId is provided via props, it overrides URL context completely
 if (lockedCourseId) {
 setUrlContext({ courseId: lockedCourseId, isLocked: true });
 setForm(prev => ({ ...prev, course: lockedCourseId }));
 }
 }, [lockedCourseId]);

 const fetchCourses = async () => {
 const { data } = await apiFetch('/api/v1/courses/?page_size=100');
 if (data?.results) setCourses(data.results);
 else if (Array.isArray(data)) setCourses(data);
 };

 const fetchModules = async () => {
 setIsFetching(true);
 setError('');
 const queryParams: Record<string, string> = {
 page: page.toString(),
 page_size: pageSize.toString(),
 search: searchTerm,
 ordering: 'order'
 };
 
 if (lockedCourseId) {
 queryParams.course = lockedCourseId;
 }

 const query = new URLSearchParams(queryParams).toString();

 const { data, error: e } = await apiFetch(`/api/v1/modules/?${query}`);
 if (e) setError(e);
 else if (data?.results) {
 setModules(data.results);
 setTotalCount(data.count || 0);
 } else if (Array.isArray(data)) {
 setModules(data);
 setTotalCount(data.length);
 }
 setIsFetching(false);
 };

 const openModal = (mod: Module) => {
 setActionError('');
 setIsCreateExpanded(false);
 setCreatedModuleId(null);
 setSelectedModule(mod);
 setForm({
 course: mod.course,
 title: mod.title,
 order: mod.order
 });
 setIsModalOpen(true);
 };

 const toggleCreate = () => {
 if (!isCreateExpanded) {
 setSelectedModule(null);
 setCreatedModuleId(null);
 setForm({
 course: urlContext.isLocked && urlContext.courseId ? urlContext.courseId : (selectedCourses.length === 1 ? selectedCourses[0] : (courses[0]?.id || '')),
 title: '',
 order: modules.length + 1
 });
 setActionError('');
 }
 // If we are closing, and we have a locked context from URL, clear it so next open is fresh
 if (isCreateExpanded && urlContext.isLocked) {
 setUrlContext({ isLocked: false });
 }
 setIsCreateExpanded(!isCreateExpanded);
 };

 const handleSubmit = async (ev: React.FormEvent) => {
 ev.preventDefault();
 setActionError('');
 setIsActionLoading(true);

 const isEditing = !!selectedModule;
 const endpoint = `/api/v1/modules/${isEditing ? `${selectedModule.id}/` : ''}`;

 // Only send API-supported fields: course, title, order
 const payload = { course: form.course, title: form.title, order: form.order };

 const { data, error: apiErr, status } = await apiFetch(endpoint, {
 method: isEditing ? 'PATCH' : 'POST',
 body: JSON.stringify(isEditing ? { title: form.title, order: form.order } : payload)
 });

 if (apiErr || (status !== 200 && status !== 201)) {
 setActionError(apiErr || 'Failed to save module.');
 } else {
 fetchModules();
 if (isEditing) {
 setIsModalOpen(false);
 } else {
 if (data?.id) {
 setCreatedModuleId(data.id);
 } else {
 setIsCreateExpanded(false);
 }
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
 const { error: e, status } = await apiFetch(`/api/v1/modules/${itemToDelete}/`, { method: 'DELETE' });
 if (e || status !== 204) setError(e || 'Failed to delete module.');
 else fetchModules();
 setIsDeleteModalOpen(false);
 setItemToDelete(null);
 setIsActionLoading(false);
 };

 const getCourseName = (courseId: string) => {
 return courses.find(c => c.id === courseId)?.title || courseId;
 };

 if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
 if (!user || (user.role !== 'super_admin' && user.role !== 'course_provider' && user.role !== 'org_admin')) return null;

 const canManage = user.role === 'super_admin' || user.role === 'course_provider';

 const filteredModules = modules.filter(m => {
 const matchesCourse = selectedCourses.length === 0 || selectedCourses.includes(m.course);
 const matchesSearch = !searchTerm || m.title.toLowerCase().includes(searchTerm.toLowerCase());
 return matchesCourse && matchesSearch;
 });

 return (
 <div className="min-h-screen bg-muted pb-20">
 {!lockedCourseId && (
 <div className="bg-card border-b border-border">
 <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-1">Modules Management</h1>
 <p className="text-muted-foreground">Organize courses into structured learning modules.</p>
 </div>
 </div>
 </div>
 )}

 {canManage && (
 <ExpandableCreateSection
 title="Add New Module"
 isOpen={isCreateExpanded}
 onToggle={toggleCreate}
 isSuccess={!!createdModuleId}
 successTitle="Module Created Successfully!"
 successDescription="What would you like to add to this module?"
 nextSteps={createdModuleId ? [
 { label: 'Add a Lesson', href: lockedCourseId ? `/admin/courses/${lockedCourseId}/lessons?create=true&moduleId=${createdModuleId}` : `/admin/lessons?create=true&moduleId=${createdModuleId}`, icon: '📄' },
 { label: 'Add Module Quiz', href: lockedCourseId ? `/admin/courses/${lockedCourseId}/assessments?create=true&parent_type=module_quiz&moduleId=${createdModuleId}` : `/admin/assessments?create=true&parent_type=module_quiz&moduleId=${createdModuleId}`, variant: 'secondary', icon: '📋' }
 ] : []}
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

 {!urlContext.isLocked && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Parent Course</label>
 <select
 className={SELECT_CLS}
 value={form.course}
 onChange={e => setForm({ ...form, course: e.target.value })}
 disabled={isActionLoading}
 required
 >
 <option value="" disabled>Select a course</option>
 {courses.map(c => (
 <option key={c.id} value={c.id}>{c.title}</option>
 ))}
 </select>
 </div>
 )}
 
 {urlContext.isLocked && (
 <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 mb-4 flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Parent Context Linked</p>
 <p className="text-sm text-blue-900 font-medium">{getCourseName(form.course)}</p>
 </div>
 <span className="text-xl opacity-30">🔗</span>
 </div>
 )}

 <Input
 label="Module Title"
 value={form.title}
 onChange={e => setForm({ ...form, title: e.target.value })}
 required
 disabled={isActionLoading}
 placeholder="e.g., Introduction to Phishing"
 autoFocus
 />

 <Input
 label="Display Order"
 type="number"
 value={form.order.toString()}
 onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
 required
 disabled={isActionLoading}
 />

 <div className="pt-4 flex justify-end gap-3">
 <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>
 {isActionLoading ? 'Saving...' : 'Create Module'}
 </Button>
 </div>
 </form>
 </ExpandableCreateSection>
 )}

 <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 flex flex-col lg:flex-row gap-8">
 {/* Sidebar Filter */}
 {!lockedCourseId && (
 <div className="w-full lg:w-64 shrink-0">
 <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-6 sticky top-24">
 <div className="mb-6">
 <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Search</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
 <input
 type="text"
 placeholder="Search by module title..."
 className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
 value={searchTerm}
 onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
 />
 </div>
 </div>

 <div className="mb-8">
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Parent Course</h3>
 <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
 {courses.map(course => (
 <label key={course.id} className="flex items-start gap-3 cursor-pointer group">
 <input
 type="checkbox"
 className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
 checked={selectedCourses.includes(course.id)}
 onChange={() => {
 setSelectedCourses(prev =>
 prev.includes(course.id) ? prev.filter(id => id !== course.id) : [...prev, course.id]
 );
 }}
 />
 <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{course.title}</span>
 </label>
 ))}
 {courses.length === 0 && <p className="text-muted-foreground text-xs italic">No courses available.</p>}
 </div>
 </div>

 {(selectedCourses.length > 0 || searchTerm) && (
 <button
 onClick={() => { setSelectedCourses([]); setSearchTerm(''); }}
 className="text-xs text-primary font-bold hover:text-primary transition-colors duration-200-hover transition-colors flex items-center gap-1 cursor-pointer"
 >
 ✕ Clear all filters
 </button>
 )}
 </div>
 </div>
 )}

 {/* Main Content */}
 <div className="flex-1">
 {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

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
 {!lockedCourseId && <th className="px-6 py-4">Course</th>}
 <th className="px-6 py-4 text-center">Order</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredModules.length === 0 ? (
 <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No modules found matching your criteria.</td></tr>
 ) : filteredModules.map(m => (
 <tr key={m.id} className="hover:bg-muted transition-colors">
 <td className="px-6 py-4 font-medium text-foreground">
 <Link href={lockedCourseId ? `/admin/courses/${lockedCourseId}/modules/${m.id}` : `/admin/modules/${m.id}`} className="hover:text-primary transition-colors hover:underline">
 {m.title}
 </Link>
 </td>
 {!lockedCourseId && <td className="px-6 py-4 text-muted-foreground truncate max-w-[250px]">{getCourseName(m.course)}</td>}
 <td className="px-6 py-4 text-center">{m.order}</td>
 <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
 {canManage && (
 <button onClick={() => openModal(m)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">Edit</button>
 )}
 {canManage && (
 <button onClick={() => handleDelete(m.id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">Delete</button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {totalCount > pageSize && !selectedCourses.length && !searchTerm && (
 <div className="mt-6 flex justify-between items-center bg-card p-4 rounded-xl border border-border">
 <span className="text-sm text-muted-foreground">Showing {modules.length} of {totalCount} modules</span>
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

 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Module">
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

 {!lockedCourseId && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Parent Course</label>
 <select
 className={SELECT_CLS}
 value={form.course}
 onChange={e => setForm({ ...form, course: e.target.value })}
 disabled={isActionLoading}
 required
 >
 <option value="" disabled>Select a course</option>
 {courses.map(c => (
 <option key={c.id} value={c.id}>{c.title}</option>
 ))}
 </select>
 </div>
 )}

 <Input
 label="Module Title"
 value={form.title}
 onChange={e => setForm({ ...form, title: e.target.value })}
 required
 disabled={isActionLoading}
 placeholder="e.g., Introduction to Phishing"
 autoFocus
 />

 <Input
 label="Display Order"
 type="number"
 value={form.order.toString()}
 onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
 required
 disabled={isActionLoading}
 />

 <div className="pt-4 flex justify-end gap-3">
 <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>
 {isActionLoading ? 'Saving...' : 'Save Changes'}
 </Button>
 </div>
 </form>
 </Modal>

 <ConfirmModal
 isOpen={isDeleteModalOpen}
 onClose={() => setIsDeleteModalOpen(false)}
 onConfirm={confirmDelete}
 title="Delete Module"
 message="Are you sure you want to delete this module? This action cannot be undone."
 confirmText="Delete"
 isLoading={isActionLoading}
 />
 </div>
 );
}
