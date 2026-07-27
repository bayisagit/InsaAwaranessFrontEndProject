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
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';

interface Lesson {
 id: string;
 module: string;
 title: string;
 content_type: 'video' | 'article' | 'image' | 'assessment';
 language: string;
 content?: string;
 media_url?: string;
 image_url?: string;
 assessment_type?: 'true_false' | 'multiple_choice' | 'matching';
 assessment_payload?: any; // object on response, string while editing in form
 passing_score?: number;
 order: number;
}


interface Module {
 id: string;
 title: string;
}

const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card";

interface LessonsManagerProps {
 lockedModuleId?: string;
 lockedCourseId?: string;
}

export function LessonsManager({ lockedModuleId, lockedCourseId }: LessonsManagerProps) {
 const { user, isAuthenticated, isLoading } = useAuth();
 const router = useRouter();

 const [lessons, setLessons] = useState<Lesson[]>([]);
 const [modules, setModules] = useState<Module[]>([]);
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
 const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

 const [createdLessonId, setCreatedLessonId] = useState<string | null>(null);
 const [urlContext, setUrlContext] = useState<{ moduleId?: string; isLocked: boolean }>({ isLocked: false });

 const [form, setForm] = useState({
 module: '',
 title: '',
 content_type: 'video',
 language: 'en',
 content: '',
 media_url: '',
 image_url: '',
 assessment_type: 'multiple_choice',
 assessment_payload: '', // stored as JSON string while editing, parsed before submit
 passing_score: 70,
 order: 0
 });


 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [itemToDelete, setItemToDelete] = useState<string | null>(null);

 // Filter states
 const [selectedModules, setSelectedModules] = useState<string[]>([]);
 const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
 const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

 useEffect(() => {
 if (!isLoading) {
 if (!isAuthenticated) router.push('/login');
 else if (user?.role !== 'super_admin' && user?.role !== 'org_admin' && user?.role !== 'course_provider') router.push('/dashboard');
 else {
 fetchModules();
 fetchLessons();
 }
 }
 }, [isAuthenticated, isLoading, user, router, page]);

 // Handle URL parameters for continuous creation workflow
 useEffect(() => {
 if (typeof window !== 'undefined') {
 const params = new URLSearchParams(window.location.search);
 const create = params.get('create');
 const moduleId = params.get('moduleId');
 
 if (create === 'true') {
 setIsCreateExpanded(true);
 if (moduleId && !lockedModuleId) {
 setUrlContext({ moduleId, isLocked: true });
 setForm(prev => ({ ...prev, module: moduleId }));
 }
 }
 }
 
 if (lockedModuleId) {
 setUrlContext({ moduleId: lockedModuleId, isLocked: true });
 setForm(prev => ({ ...prev, module: lockedModuleId }));
 }
 }, [lockedModuleId]);

 const fetchModules = async () => {
 const { data } = await apiFetch('/api/v1/modules/?page_size=100');
 if (data?.results) setModules(data.results);
 else if (Array.isArray(data)) setModules(data);
 };

 const fetchLessons = async () => {
 setIsFetching(true);
 setError('');
 const queryParams: Record<string, string> = {
 page: page.toString(),
 page_size: pageSize.toString(),
 search: searchTerm,
 ordering: 'order'
 };
 
 if (lockedModuleId) {
 queryParams.module = lockedModuleId;
 } else if (lockedCourseId) {
 queryParams.course = lockedCourseId; // Assumes backend supports course=... for lessons
 }

 const query = new URLSearchParams(queryParams).toString();

 const { data, error: e } = await apiFetch(`/api/v1/lessons/?${query}`);
 if (e) setError(e);
 else if (data?.results) {
 setLessons(data.results);
 setTotalCount(data.count || 0);
 } else if (Array.isArray(data)) {
 setLessons(data);
 setTotalCount(data.length);
 }
 setIsFetching(false);
 };

 const toggleCreate = () => {
 if (!isCreateExpanded) {
 setActionError('');
 setSelectedLesson(null);
 setCreatedLessonId(null);
 setForm({
 module: urlContext.isLocked && urlContext.moduleId ? urlContext.moduleId : (selectedModules.length === 1 ? selectedModules[0] : (modules[0]?.id || '')),
 title: '',
 content_type: 'video',
 language: 'en',
 content: '',
 media_url: '',
 image_url: '',
 assessment_type: 'multiple_choice',
 assessment_payload: '',
 passing_score: 70,
 order: lessons.length + 1
 });
 }
 // Clear locked context if closed
 if (isCreateExpanded && urlContext.isLocked) {
 setUrlContext({ isLocked: false });
 }
 setIsCreateExpanded(!isCreateExpanded);
 };

 const handleEdit = (lesson: Lesson) => {
 setIsCreateExpanded(false);
 setCreatedLessonId(null);
 setActionError('');
 setSelectedLesson(lesson);
 setForm({
 module: lesson.module,
 title: lesson.title,
 content_type: lesson.content_type,
 language: lesson.language || 'en',
 content: lesson.content || '',
 media_url: lesson.media_url || '',
 image_url: lesson.image_url || '',
 assessment_type: lesson.assessment_type || 'multiple_choice',
 assessment_payload: lesson.assessment_payload
 ? (typeof lesson.assessment_payload === 'string'
 ? lesson.assessment_payload
 : JSON.stringify(lesson.assessment_payload, null, 2))
 : '',
 passing_score: lesson.passing_score ?? 70,
 order: lesson.order
 });
 setIsModalOpen(true);
 };

 const handleSubmit = async (ev?: React.FormEvent) => {
 if (ev) ev.preventDefault();
 setActionError('');
 setIsActionLoading(true);

 // Build API payload
 const payload: Record<string, any> = {
 module: form.module,
 title: form.title,
 content_type: form.content_type,
 language: form.language,
 order: form.order,
 };

 if (form.content_type === 'video') {
 payload.media_url = form.media_url;
 payload.content = form.content || '';
 } else if (form.content_type === 'article') {
 payload.content = form.content;
 } else if (form.content_type === 'image') {
 payload.image_url = form.image_url;
 payload.content = form.content || '';
 } else if (form.content_type === 'assessment') {
 try {
 const parsed = JSON.parse(form.assessment_payload);
 if (!parsed?.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
 throw new Error('Payload must have a non-empty "questions" array.');
 }
 for (let i = 0; i < parsed.questions.length; i++) {
 const q = parsed.questions[i];
 if (!q.id || !q.type || !q.question || q.correct_answer === undefined)
 throw new Error(`Question ${i + 1} missing required fields (id, type, question, correct_answer).`);
 if (!['multiple_choice', 'true_false', 'matching'].includes(q.type))
 throw new Error(`Question ${i + 1} has invalid type "${q.type}". Use multiple_choice, true_false, or matching.`);
 if (q.type === 'multiple_choice') {
 if (!Array.isArray(q.options) || q.options.length === 0)
 throw new Error(`Multiple choice question ${i + 1} must have an "options" array.`);
 if (!q.options.find((opt: any) => opt.id === q.correct_answer))
 throw new Error(`Multiple choice question ${i + 1}: correct_answer doesn't match any option id.`);
 } else if (q.type === 'true_false') {
 if (typeof q.correct_answer !== 'boolean')
 throw new Error(`True/False question ${i + 1}: correct_answer must be boolean true or false (not a string).`);
 } else if (q.type === 'matching') {
 if (typeof q.correct_answer !== 'object' || Array.isArray(q.correct_answer))
 throw new Error(`Matching question ${i + 1}: correct_answer must be a plain object.`);
 }
 }
 // ✅ Send as parsed object — backend expects object, not string
 payload.assessment_payload = parsed;
 payload.assessment_type = form.assessment_type;
 payload.passing_score = form.passing_score;
 } catch (err: any) {
 setActionError(err.message || 'Invalid assessment payload JSON.');
 setIsActionLoading(false);
 return;
 }
 }

 const isEditing = !!selectedLesson;
 const endpoint = `/api/v1/lessons/${isEditing ? `${selectedLesson!.id}/` : ''}`;

 const { data, error: apiErr, status } = await apiFetch(endpoint, {
 method: isEditing ? 'PATCH' : 'POST',
 body: JSON.stringify(payload)
 });

 if (apiErr || (status !== 200 && status !== 201)) {
 setActionError(apiErr || 'Failed to save lesson.');
 } else {
 fetchLessons();
 if (isEditing) {
 setIsModalOpen(false);
 } else {
 if (data?.id) {
 setCreatedLessonId(data.id);
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
 const { error: e, status } = await apiFetch(`/api/v1/lessons/${itemToDelete}/`, { method: 'DELETE' });
 if (e || status !== 204) setError(e || 'Failed to delete lesson.');
 else fetchLessons();
 setIsDeleteModalOpen(false);
 setItemToDelete(null);
 setIsActionLoading(false);
 };

 const getModuleName = (id: string) => modules.find(m => m.id === id)?.title || id;

 if (isLoading) return (
 <div className="flex justify-center items-center min-h-[50vh]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
 </div>
 );

 if (!user || (user.role !== 'super_admin' && user.role !== 'org_admin' && user.role !== 'course_provider')) return null;

 const filteredLessons = lessons.filter(l => {
 const matchesModule = selectedModules.length === 0 || selectedModules.includes(l.module);
 const matchesType = selectedTypes.length === 0 || selectedTypes.includes(l.content_type);
 const matchesLanguage = selectedLanguages.length === 0 || (l.language && selectedLanguages.includes(l.language));
 const matchesSearch = !searchTerm || l.title.toLowerCase().includes(searchTerm.toLowerCase());
 return matchesModule && matchesType && matchesLanguage && matchesSearch;
 });

 return (
 <div className="min-h-screen bg-muted pb-20">
 {!lockedModuleId && (
 <div className="bg-card border-b border-border">
 <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-1">Lessons Management</h1>
 <p className="text-muted-foreground">Create rich content including videos, articles, and assessments.</p>
 </div>
 </div>
 </div>
 )}

 {(user?.role === 'course_provider' || user?.role === 'super_admin') && (
 <ExpandableCreateSection
 title="Add New Lesson"
 isOpen={isCreateExpanded}
 onToggle={toggleCreate}
 isSuccess={!!createdLessonId}
 successTitle="Lesson Created Successfully!"
 successDescription="What would you like to add next?"
 nextSteps={createdLessonId ? [
 { label: 'Add Lesson Assessment', href: lockedCourseId ? `/admin/courses/${lockedCourseId}/assessments?create=true&parent_type=lesson_assessment&lessonId=${createdLessonId}` : `/admin/assessments?create=true&parent_type=lesson_assessment&lessonId=${createdLessonId}`, icon: '📝' },
 ...(lockedCourseId ? [] : [{ label: 'Add Global Resource', href: `/admin/resources?create=true`, variant: 'secondary' as const, icon: '📎' as const }])
 ] : []}
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100 mb-4">{actionError}</div>}

 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <Input
 label="Lesson Title"
 placeholder="e.g. Introduction to Cybersecurity"
 value={form.title}
 onChange={(e) => setForm({ ...form, title: e.target.value })}
 required
 autoFocus
 />
 </div>

 {!lockedModuleId && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Module</label>
 <select
 className={SELECT_CLS}
 value={form.module}
 onChange={(e) => setForm({ ...form, module: e.target.value })}
 required
 >
 <option value="">Select Module</option>
 {modules.map(m => (
 <option key={m.id} value={m.id}>{m.title}</option>
 ))}
 </select>
 </div>
 )}

 {urlContext.isLocked && !lockedModuleId && (
 <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2 flex items-center justify-between col-span-1 h-full max-h-[68px]">
 <div>
 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Linked Module</p>
 <p className="text-sm text-blue-900 font-medium truncate max-w-[200px]">{getModuleName(form.module)}</p>
 </div>
 <span className="text-xl opacity-30">🔗</span>
 </div>
 )}

 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Language</label>
 <select
 className={SELECT_CLS}
 value={form.language}
 onChange={(e) => setForm({ ...form, language: e.target.value })}
 required
 >
 <option value="en">English</option>
 <option value="am">Amharic</option>
 <option value="om">Oromo</option>
 <option value="so">Somali</option>
 <option value="ti">Tigrinya</option>
 </select>
 </div>

 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Content Type</label>
 <select
 className={SELECT_CLS}
 value={form.content_type}
 onChange={(e) => setForm({ ...form, content_type: e.target.value as any })}
 required
 >
 <option value="video">Video</option>
 <option value="article">Article</option>
 <option value="image">Image</option>
 <option value="assessment">Assessment</option>
 </select>
 </div>

 <div>
 <Input
 label="Order"
 type="number"
 value={form.order.toString()}
 onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
 required
 />
 </div>
 </div>

 <div className="border-t border-border pt-4">
 {form.content_type === 'video' && (
 <div className="space-y-4">
 <label className="block text-sm font-semibold text-foreground">Video Content</label>
 <CloudinaryUpload
 onUploadSuccess={(url) => setForm({ ...form, media_url: url })}
 folder="lessons/videos"
 resourceType="video"
 />
 <Input
 label="Or Video URL"
 placeholder="https://..."
 value={form.media_url}
 onChange={(e) => setForm({ ...form, media_url: e.target.value })}
 />
 </div>
 )}

 {form.content_type === 'article' && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Article Content</label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[200px]"
 placeholder="Write your article content here..."
 value={form.content}
 onChange={(e) => setForm({ ...form, content: e.target.value })}
 required
 />
 </div>
 )}

 {form.content_type === 'image' && (
 <div className="space-y-4">
 <label className="block text-sm font-semibold text-foreground">Image</label>
 <CloudinaryUpload
 onUploadSuccess={(url) => setForm({ ...form, image_url: url })}
 folder="lessons/images"
 />
 <Input
 label="Or Image URL"
 placeholder="https://..."
 value={form.image_url}
 onChange={(e) => setForm({ ...form, image_url: e.target.value })}
 />
 </div>
 )}

 {form.content_type === 'assessment' && (
 <div className="grid grid-cols-1 gap-4">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Assessment Type</label>
 <select
 className={SELECT_CLS}
 value={form.assessment_type}
 onChange={(e) => setForm({ ...form, assessment_type: e.target.value as any })}
 required
 >
 <option value="multiple_choice">Multiple Choice</option>
 <option value="true_false">True / False</option>
 <option value="matching">Matching</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Passing Score (%)</label>
 <input
 type="number"
 min={0} max={100}
 className="block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
 value={form.passing_score}
 onChange={(e) => setForm({ ...form, passing_score: parseInt(e.target.value) || 0 })}
 required
 />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Assessment JSON Payload</label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground font-mono text-xs focus:ring-2 focus:ring-primary outline-none min-h-[180px] resize-y"
 placeholder='{"questions": [{"id":"q1","type":"multiple_choice","question":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."}],"correct_answer":"a"}]}'
 value={form.assessment_payload}
 onChange={(e) => setForm({ ...form, assessment_payload: e.target.value })}
 required
 />
 <p className="text-[10px] text-muted-foreground mt-1">Use types: <code>multiple_choice</code>, <code>true_false</code>, <code>matching</code>. correct_answer must match an option id for multiple_choice, or be boolean for true_false.</p>
 </div>
 </div>
 )}

 </div>

 <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
 <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>
 {isActionLoading ? 'Creating...' : 'Create Lesson'}
 </Button>
 </div>
 </form>
 </ExpandableCreateSection>
 )}

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
 placeholder="Lesson title..."
 className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
 value={searchTerm}
 onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
 />
 </div>
 </div>

 {!lockedModuleId && (
 <div className="mb-6">
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 border-b border-border pb-2">Module</h3>
 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
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
 )}

 <div className="mb-6">
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 border-b border-border pb-2">Content Type</h3>
 <div className="space-y-2">
 {['article', 'video', 'image', 'assessment'].map(type => (
 <label key={type} className="flex items-center gap-3 cursor-pointer group">
 <input
 type="checkbox"
 className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
 checked={selectedTypes.includes(type)}
 onChange={() => {
 setSelectedTypes(prev =>
 prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
 );
 }}
 />
 <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors capitalize">{type}</span>
 </label>
 ))}
 </div>
 </div>

 <div className="mb-8">
 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 border-b border-border pb-2">Language</h3>
 <div className="space-y-2">
 {[
 { id: 'en', name: 'English' },
 { id: 'am', name: 'Amharic' },
 { id: 'om', name: 'Oromo' },
 { id: 'so', name: 'Somali' },
 { id: 'ti', name: 'Tigrinya' }
 ].map(lang => (
 <label key={lang.id} className="flex items-center gap-3 cursor-pointer group">
 <input
 type="checkbox"
 className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
 checked={selectedLanguages.includes(lang.id)}
 onChange={() => {
 setSelectedLanguages(prev =>
 prev.includes(lang.id) ? prev.filter(l => l !== lang.id) : [...prev, lang.id]
 );
 }}
 />
 <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors uppercase">{lang.id} - {lang.name}</span>
 </label>
 ))}
 </div>
 </div>

 {(selectedModules.length > 0 || selectedTypes.length > 0 || selectedLanguages.length > 0 || searchTerm) && (
 <button
 onClick={() => { setSelectedModules([]); setSelectedTypes([]); setSelectedLanguages([]); setSearchTerm(''); }}
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
 {!lockedModuleId && <th className="px-6 py-4 border-l border-border">Module</th>}
 <th className="px-6 py-4">Type</th>
 <th className="px-6 py-4">Lang</th>
 <th className="px-6 py-4 text-center">Order</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredLessons.length === 0 ? (
 <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No lessons found matching your criteria.</td></tr>
 ) : filteredLessons.map(l => (
 <tr key={l.id} className="hover:bg-muted transition-colors">
 <td className="px-6 py-4 font-medium text-foreground">
 <Link href={lockedCourseId && lockedModuleId ? `/admin/courses/${lockedCourseId}/modules/${lockedModuleId}/lessons/${l.id}` : `/admin/lessons/${l.id}`} className="hover:text-primary transition-colors hover:underline">
 {l.title}
 </Link>
 </td>
 {!lockedModuleId && <td className="px-6 py-4 text-muted-foreground border-l border-border truncate max-w-[200px]">{getModuleName(l.module)}</td>}
 <td className="px-6 py-4">
 <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${l.content_type === 'video' ? 'bg-blue-50 text-blue-600' :
 l.content_type === 'article' ? 'bg-green-50 text-green-600' :
 l.content_type === 'assessment' ? 'bg-purple-50 text-purple-600' :
 'bg-muted text-muted-foreground'
 }`}>
 {l.content_type}
 </span>
 </td>
 <td className="px-6 py-4 uppercase text-xs">{l.language}</td>
 <td className="px-6 py-4 text-center">{l.order}</td>
 <td className="px-6 py-4 text-right whitespace-nowrap">
 <div className="flex items-center justify-end gap-2">
 {(user?.role === 'course_provider' || user?.role === 'super_admin') && (
 <button onClick={() => handleEdit(l)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">Edit</button>
 )}
 {(user?.role === 'super_admin' || user?.role === 'course_provider') && (
 <button onClick={() => handleDelete(l.id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">Delete</button>
 )}
 </div>
 </td>

 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {totalCount > pageSize && !selectedModules.length && !selectedTypes.length && !selectedLanguages.length && !searchTerm && (
 <div className="mt-6 flex justify-between items-center bg-card p-4 rounded-xl border border-border">
 <span className="text-sm text-muted-foreground">Showing {lessons.length} of {totalCount} lessons</span>
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

 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Lesson" maxWidth="2xl">
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100 mb-4">{actionError}</div>}

 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <Input
 label="Lesson Title"
 placeholder="e.g. Introduction to Cybersecurity"
 value={form.title}
 onChange={(e) => setForm({ ...form, title: e.target.value })}
 required
 autoFocus
 />
 </div>

 {!lockedModuleId && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Module</label>
 <select
 className={SELECT_CLS}
 value={form.module}
 onChange={(e) => setForm({ ...form, module: e.target.value })}
 required
 >
 <option value="">Select Module</option>
 {modules.map(m => (
 <option key={m.id} value={m.id}>{m.title}</option>
 ))}
 </select>
 </div>
 )}

 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Language</label>
 <select
 className={SELECT_CLS}
 value={form.language}
 onChange={(e) => setForm({ ...form, language: e.target.value })}
 required
 >
 <option value="en">English</option>
 <option value="am">Amharic</option>
 <option value="om">Oromo</option>
 <option value="so">Somali</option>
 <option value="ti">Tigrinya</option>
 </select>
 </div>

 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Content Type</label>
 <select
 className={SELECT_CLS}
 value={form.content_type}
 onChange={(e) => setForm({ ...form, content_type: e.target.value as any })}
 required
 >
 <option value="video">Video</option>
 <option value="article">Article</option>
 <option value="image">Image</option>
 <option value="assessment">Assessment</option>
 </select>
 </div>

 <div>
 <Input
 label="Order"
 type="number"
 value={form.order.toString()}
 onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
 required
 />
 </div>
 </div>

 <div className="border-t border-border pt-4">
 {form.content_type === 'video' && (
 <div className="space-y-4">
 <label className="block text-sm font-semibold text-foreground">Video Content</label>
 <CloudinaryUpload
 onUploadSuccess={(url) => setForm({ ...form, media_url: url })}
 folder="lessons/videos"
 resourceType="video"
 />
 <Input
 label="Or Video URL"
 placeholder="https://..."
 value={form.media_url}
 onChange={(e) => setForm({ ...form, media_url: e.target.value })}
 />
 </div>
 )}

 {form.content_type === 'article' && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Article Content</label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[200px]"
 placeholder="Write your article content here..."
 value={form.content}
 onChange={(e) => setForm({ ...form, content: e.target.value })}
 required
 />
 </div>
 )}

 {form.content_type === 'image' && (
 <div className="space-y-4">
 <label className="block text-sm font-semibold text-foreground">Image</label>
 <CloudinaryUpload
 onUploadSuccess={(url) => setForm({ ...form, image_url: url })}
 folder="lessons/images"
 />
 <Input
 label="Or Image URL"
 placeholder="https://..."
 value={form.image_url}
 onChange={(e) => setForm({ ...form, image_url: e.target.value })}
 />
 </div>
 )}

 {form.content_type === 'assessment' && (
 <div className="grid grid-cols-1 gap-4">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Assessment Type</label>
 <select
 className={SELECT_CLS}
 value={form.assessment_type}
 onChange={(e) => setForm({ ...form, assessment_type: e.target.value as any })}
 required
 >
 <option value="multiple_choice">Multiple Choice</option>
 <option value="true_false">True / False</option>
 <option value="matching">Matching</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Passing Score (%)</label>
 <input
 type="number"
 min={0} max={100}
 className="block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
 value={form.passing_score}
 onChange={(e) => setForm({ ...form, passing_score: parseInt(e.target.value) || 0 })}
 required
 />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Assessment JSON Payload</label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground font-mono text-xs focus:ring-2 focus:ring-primary outline-none min-h-[180px] resize-y"
 placeholder='{"questions": [{"id":"q1","type":"multiple_choice","question":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."}],"correct_answer":"a"}]}'
 value={form.assessment_payload}
 onChange={(e) => setForm({ ...form, assessment_payload: e.target.value })}
 required
 />
 <p className="text-[10px] text-muted-foreground mt-1">Use types: <code>multiple_choice</code>, <code>true_false</code>, <code>matching</code>. correct_answer must match an option id for multiple_choice, or be boolean for true_false.</p>
 </div>
 </div>
 )}

 </div>

 <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
 <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>
 {isActionLoading ? 'Updating...' : 'Update Lesson'}
 </Button>
 </div>
 </form>
 </Modal>

 <ConfirmModal
 isOpen={isDeleteModalOpen}
 onClose={() => setIsDeleteModalOpen(false)}
 onConfirm={confirmDelete}
 title="Delete Lesson"
 message="Are you sure you want to delete this lesson? This action cannot be undone."
 confirmText="Delete"
 isLoading={isActionLoading}
 />
 </div>
 );
}
