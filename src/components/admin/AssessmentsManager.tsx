'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Assessment,
    Course,
    Module,
    Lesson,
    getAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getCourses,
    getModules,
    getLessons,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';

const SELECT_CLS = 'block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white';
const LABEL_CLS = 'block text-sm font-semibold text-gray-700 mb-1';

type ParentType = 'lesson_assessment' | 'module_quiz' | 'course_exam';

const PARENT_LABELS: Record<ParentType, { label: string; icon: string }> = {
    lesson_assessment: { label: 'Lesson Assessment', icon: '📝' },
    module_quiz: { label: 'Module Quiz', icon: '📋' },
    course_exam: { label: 'Course Exam', icon: '🎓' },
};

interface AssessmentsManagerProps {
    lockedLessonId?: string;
    lockedModuleId?: string;
    lockedCourseId?: string;
}

export function AssessmentsManager({ lockedLessonId, lockedModuleId, lockedCourseId }: AssessmentsManagerProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [filterType, setFilterType] = useState<ParentType | ''>('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 15;

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateExpanded, setIsCreateExpanded] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selectedItem, setSelectedItem] = useState<Assessment | null>(null);

    const [createdAssessmentId, setCreatedAssessmentId] = useState<string | null>(null);
    const [urlContext, setUrlContext] = useState<{ parent_type?: ParentType, course_id?: string, module_id?: string, lesson_id?: string, isLocked: boolean }>({ isLocked: false });

    // Cascading selects for create
    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    const [form, setForm] = useState({
        parent_type: 'lesson_assessment' as ParentType,
        course_id: '',
        module_id: '',
        lesson_id: '',
        title: '',
        description: '',
        passing_score: 70,
        time_limit_minutes: 0,
        shuffle_questions: false,
    });

    // Delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Assessment | null>(null);

    const fetchAssessments = useCallback(async () => {
        setIsFetching(true); setError('');
        const params: Record<string, any> = { page, page_size: pageSize };
        if (filterType) params.parent_type = filterType;
        if (lockedLessonId) params.lesson = lockedLessonId;
        if (lockedModuleId) params.module = lockedModuleId;
        if (lockedCourseId) params.course_scope = lockedCourseId;
        const { data, error: e } = await getAssessments(params);
        if (e) setError(e);
        else if (data?.results) { setAssessments(data.results); setTotalCount(data.count); }
        setIsFetching(false);
    }, [page, filterType, lockedLessonId, lockedModuleId, lockedCourseId]);

    const fetchCourses = useCallback(async () => {
        const { data } = await getCourses({ page_size: 100 });
        setCourses(data?.results ?? []);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (!['super_admin', 'course_provider', 'org_admin'].includes(user?.role || '')) router.push('/dashboard');
            else { fetchAssessments(); fetchCourses(); }
        }
    }, [isAuthenticated, isLoading, user, router, fetchAssessments, fetchCourses]);

    // Handle URL parameters for continuous creation workflow
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const create = params.get('create');
            const parentType = params.get('parent_type') as ParentType;
            const courseId = params.get('courseId') || params.get('course_id');
            const moduleId = params.get('moduleId') || params.get('module_id');
            const lessonId = params.get('lessonId') || params.get('lesson_id');
            
            if (create === 'true') {
                setIsCreateExpanded(true);
                if (parentType && !lockedLessonId) {
                    setUrlContext({ 
                        parent_type: parentType, 
                        course_id: courseId || '', 
                        module_id: moduleId || '', 
                        lesson_id: lessonId || '', 
                        isLocked: true 
                    });
                    setForm(prev => ({ 
                        ...prev, 
                        parent_type: parentType,
                        course_id: courseId || '',
                        module_id: moduleId || '',
                        lesson_id: lessonId || ''
                    }));
                }
            }
        }
        
        if (lockedLessonId) {
            setUrlContext({ parent_type: 'lesson_assessment', lesson_id: lockedLessonId, isLocked: true });
            setForm(prev => ({ ...prev, parent_type: 'lesson_assessment', lesson_id: lockedLessonId }));
            setFilterType('lesson_assessment');
        } else if (lockedModuleId) {
            setUrlContext({ parent_type: 'module_quiz', module_id: lockedModuleId, isLocked: true });
            setForm(prev => ({ ...prev, parent_type: 'module_quiz', module_id: lockedModuleId }));
            setFilterType('module_quiz');
        } else if (lockedCourseId) {
            setUrlContext({ course_id: lockedCourseId, isLocked: false });
            setForm(prev => ({ ...prev, course_id: lockedCourseId }));
        }
    }, [lockedLessonId, lockedModuleId, lockedCourseId]);

    useEffect(() => {
        if (!isModalOpen || !form.course_id) { setModules([]); setLessons([]); return; }
        getModules({ course: form.course_id, page_size: 100 }).then(({ data }) => setModules(data?.results ?? []));
    }, [form.course_id, isModalOpen]);

    useEffect(() => {
        if (!isModalOpen || !form.module_id || form.parent_type !== 'lesson_assessment') { setLessons([]); return; }
        getLessons({ module: form.module_id, page_size: 100 }).then(({ data }) => setLessons(data?.results ?? []));
    }, [form.module_id, form.parent_type, isModalOpen]);

    const resetForm = () => setForm({
        parent_type: filterType || 'lesson_assessment', course_id: '', module_id: '', lesson_id: '',
        title: '', description: '', passing_score: 70, time_limit_minutes: 0, shuffle_questions: false,
    });

    const toggleCreate = () => {
        if (!isCreateExpanded) {
            setSelectedItem(null); 
            setCreatedAssessmentId(null);
            setActionError(''); 
            
            let defaultParentType: ParentType = filterType || 'lesson_assessment';
            if (urlContext.isLocked && urlContext.parent_type) {
                defaultParentType = urlContext.parent_type;
            }

            setForm({
                parent_type: defaultParentType,
                course_id: urlContext.isLocked && urlContext.course_id ? urlContext.course_id : (lockedCourseId || ''),
                module_id: urlContext.isLocked && urlContext.module_id ? urlContext.module_id : (lockedModuleId || ''),
                lesson_id: urlContext.isLocked && urlContext.lesson_id ? urlContext.lesson_id : (lockedLessonId || ''),
                title: '', description: '', passing_score: 70, time_limit_minutes: 0, shuffle_questions: false,
            });
        }
        if (isCreateExpanded && urlContext.isLocked) {
            setUrlContext({ isLocked: false });
        }
        setIsCreateExpanded(!isCreateExpanded);
    };

    const openEdit = (a: Assessment) => {
        setSelectedItem(a); setActionError(''); setIsCreateExpanded(false);
        const pt: ParentType = a.parent_type as ParentType;
        setForm(f => ({
            ...f,
            parent_type: pt,
            title: a.title, description: a.description,
            passing_score: a.passing_score, time_limit_minutes: a.time_limit_minutes,
            shuffle_questions: a.shuffle_questions,
        }));
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setActionError(''); setIsActionLoading(true);
        let createdId = null;
        try {
            if (selectedItem) {
                const { error: err } = await updateAssessment(selectedItem.id, {
                    title: form.title, description: form.description,
                    passing_score: form.passing_score, time_limit_minutes: form.time_limit_minutes,
                    shuffle_questions: form.shuffle_questions,
                });
                if (err) { setActionError(err); setIsActionLoading(false); return; }
            } else {
                const payload: Parameters<typeof createAssessment>[0] = {
                    title: form.title || undefined, description: form.description || undefined,
                    passing_score: form.passing_score, time_limit_minutes: form.time_limit_minutes,
                    shuffle_questions: form.shuffle_questions,
                    parent_type: form.parent_type,
                };
                if (form.parent_type === 'course_exam') {
                    if (!form.course_id) { setActionError('Please select a course.'); setIsActionLoading(false); return; }
                    payload.course = form.course_id;
                } else if (form.parent_type === 'module_quiz') {
                    if (!form.module_id) { setActionError('Please select a module.'); setIsActionLoading(false); return; }
                    payload.module = form.module_id;
                } else {
                    if (!form.lesson_id) { setActionError('Please select a lesson.'); setIsActionLoading(false); return; }
                    payload.lesson = form.lesson_id;
                }
                const { data, error: err } = await createAssessment(payload);
                if (err) { setActionError(err); setIsActionLoading(false); return; }
                if (data?.id) createdId = data.id;
            }
            if (selectedItem) {
                setIsModalOpen(false);
            } else {
                if (createdId) {
                    setCreatedAssessmentId(createdId);
                } else {
                    setIsCreateExpanded(false);
                }
            }
            fetchAssessments();
        } catch { setActionError('An unexpected error occurred.'); }
        setIsActionLoading(false);
    };

    const handleDelete = (a: Assessment) => { setItemToDelete(a); setIsDeleteModalOpen(true); };
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        const { error: e } = await deleteAssessment(itemToDelete.id);
        if (e) setError(e);
        else fetchAssessments();
        setIsDeleteModalOpen(false); setItemToDelete(null); setIsActionLoading(false);
    };

    useEffect(() => {
        fetchAssessments();
    }, [filterType, fetchAssessments]);

    const filtered = assessments;

    if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
    if (!user || !['super_admin', 'course_provider', 'org_admin'].includes(user.role)) return null;

    const canManage = user.role === 'super_admin' || user.role === 'course_provider';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            {!lockedLessonId && (
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">Assessment Management</h1>
                            <p className="text-gray-500">Create and manage course exams, module quizzes, and lesson assessments.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                {/* Type filter */}
                {!lockedLessonId && !lockedModuleId && (
                    <div className="flex gap-3 mb-6 flex-wrap">
                        {(['', 'lesson_assessment', 'module_quiz', 'course_exam'] as const).map(t => (
                            <button key={t} onClick={() => { setFilterType(t); setPage(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${filterType === t ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                {t === '' ? 'All' : `${PARENT_LABELS[t].icon} ${PARENT_LABELS[t].label}`}
                            </button>
                        ))}
                    </div>
                )}

                {canManage && (
                <ExpandableCreateSection
                    title="New Assessment"
                    isOpen={isCreateExpanded}
                    onToggle={toggleCreate}
                    isSuccess={!!createdAssessmentId}
                    successTitle="Assessment Created Successfully!"
                    successDescription="Ready to add questions to your new assessment?"
                    nextSteps={createdAssessmentId ? [
                        { label: 'Add Questions', href: lockedCourseId ? `/admin/courses/${lockedCourseId}/assessments/${createdAssessmentId}/questions?create=true` : `/admin/assessments/${createdAssessmentId}/questions?create=true`, icon: '❓' }
                    ] : []}
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}

                        <div>
                            <label className={LABEL_CLS}>Assessment Type <span className="text-primary">*</span></label>
                            {urlContext.isLocked ? (
                                <div className="flex gap-3">
                                    <div className="flex-1 py-2.5 px-4 rounded-lg border font-semibold text-sm bg-primary text-white border-primary shadow text-center">
                                        {PARENT_LABELS[form.parent_type].icon} {PARENT_LABELS[form.parent_type].label}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    {(['lesson_assessment', 'module_quiz', 'course_exam'] as ParentType[]).map(t => (
                                        <button key={t} type="button"
                                            onClick={() => setForm({ ...form, parent_type: t, lesson_id: '', module_id: '' })}
                                            className={`flex-1 py-2.5 px-4 rounded-lg border font-semibold text-sm transition-all ${form.parent_type === t ? 'bg-primary text-white border-primary shadow' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                            {PARENT_LABELS[t].icon} {PARENT_LABELS[t].label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Title" placeholder="e.g. Phishing Awareness Quiz" value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })} disabled={isActionLoading} autoFocus />
                            <Input label="Passing Score (%)" type="number" value={form.passing_score.toString()}
                                onChange={e => setForm({ ...form, passing_score: parseInt(e.target.value) || 0 })}
                                required disabled={isActionLoading} />
                        </div>

                        <div>
                            <label className={LABEL_CLS}>Description</label>
                            <textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px] resize-y"
                                placeholder="Brief description of this assessment…"
                                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                disabled={isActionLoading} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLS}>Time Limit (minutes)</label>
                                <input type="number" className={SELECT_CLS} value={form.time_limit_minutes}
                                    onChange={e => setForm({ ...form, time_limit_minutes: parseInt(e.target.value) || 0 })}
                                    placeholder="0 = no limit" disabled={isActionLoading} />
                                <p className="text-[10px] text-gray-400 mt-1">Set to 0 for no time limit.</p>
                            </div>
                            <div className="flex items-center gap-3 mt-6">
                                <input type="checkbox" id="shuffle" className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    checked={form.shuffle_questions} onChange={e => setForm({ ...form, shuffle_questions: e.target.checked })}
                                    disabled={isActionLoading} />
                                <label htmlFor="shuffle" className="text-sm font-semibold text-gray-700 cursor-pointer">Shuffle Questions</label>
                            </div>
                        </div>

                        {/* Parent selection — create only */}
                        <div className="border-t border-gray-100 pt-5 space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Link to Parent</p>

                            {urlContext.isLocked ? (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Parent Context Linked</p>
                                        <p className="text-sm text-blue-900 font-medium">
                                            {form.parent_type === 'course_exam' ? 'Linked to Course' : form.parent_type === 'module_quiz' ? 'Linked to Module' : 'Linked to Lesson'}
                                        </p>
                                    </div>
                                    <span className="text-xl opacity-30">🔗</span>
                                </div>
                            ) : (
                                <>
                                    {(form.parent_type === 'course_exam') && (
                                        <>
                                            {!lockedCourseId && (
                                                <div>
                                                    <label className={LABEL_CLS}>Course <span className="text-primary">*</span></label>
                                                    <select className={SELECT_CLS} value={form.course_id} required disabled={isActionLoading}
                                                        onChange={e => setForm({ ...form, course_id: e.target.value })}>
                                                        <option value="">Select course</option>
                                                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {(form.parent_type === 'module_quiz') && (
                                        <>
                                            {!lockedCourseId && (
                                                <div>
                                                    <label className={LABEL_CLS}>Course <span className="text-primary">*</span></label>
                                                    <select className={SELECT_CLS} value={form.course_id} required disabled={isActionLoading}
                                                        onChange={e => setForm({ ...form, course_id: e.target.value, module_id: '' })}>
                                                        <option value="">Select course</option>
                                                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            <div>
                                                <label className={LABEL_CLS}>Module <span className="text-primary">*</span></label>
                                                <select className={SELECT_CLS} value={form.module_id} required disabled={!form.course_id || isActionLoading}
                                                    onChange={e => setForm({ ...form, module_id: e.target.value })}>
                                                    <option value="">Select module</option>
                                                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {(form.parent_type === 'lesson_assessment') && (
                                        <>
                                            {!lockedCourseId && (
                                                <div>
                                                    <label className={LABEL_CLS}>Course <span className="text-primary">*</span></label>
                                                    <select className={SELECT_CLS} value={form.course_id} required disabled={isActionLoading}
                                                        onChange={e => setForm({ ...form, course_id: e.target.value, module_id: '', lesson_id: '' })}>
                                                        <option value="">Select course</option>
                                                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            <div>
                                                <label className={LABEL_CLS}>Module <span className="text-primary">*</span></label>
                                                <select className={SELECT_CLS} value={form.module_id} required disabled={!form.course_id || isActionLoading}
                                                    onChange={e => setForm({ ...form, module_id: e.target.value, lesson_id: '' })}>
                                                    <option value="">Select module</option>
                                                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={LABEL_CLS}>Lesson <span className="text-primary">*</span></label>
                                                <select className={SELECT_CLS} value={form.lesson_id} required disabled={!form.module_id || isActionLoading}
                                                    onChange={e => setForm({ ...form, lesson_id: e.target.value })}>
                                                    <option value="">Select lesson</option>
                                                    {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                                                </select>
                                                <p className="text-[10px] text-amber-600 mt-1">One assessment per lesson — the backend will reject duplicates.</p>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                            <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
                            <Button type="submit" variant="primary" disabled={isActionLoading}>
                                {isActionLoading ? 'Saving…' : 'Create Assessment'}
                            </Button>
                        </div>
                    </form>
                </ExpandableCreateSection>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isFetching ? (
                        <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    {!lockedLessonId && !lockedModuleId && <th className="px-6 py-4">Type</th>}
                                    <th className="px-6 py-4 text-center">Questions</th>
                                    <th className="px-6 py-4 text-center">Pass %</th>
                                    <th className="px-6 py-4 text-center">Time Limit</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="text-4xl mb-3 opacity-30">📝</div>
                                        <p className="text-gray-500 font-medium">No assessments found.</p>
                                        <p className="text-gray-400 text-xs mt-1">Click &quot;+ New Assessment&quot; to create the first one.</p>
                                    </td></tr>
                                ) : filtered.map(a => (
                                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{a.title || <span className="text-gray-400 italic">Untitled</span>}</td>
                                        {!lockedLessonId && !lockedModuleId && (
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${a.parent_type === 'course_exam' ? 'bg-purple-50 text-purple-700' : a.parent_type === 'module_quiz' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {PARENT_LABELS[a.parent_type as ParentType]?.label ?? a.parent_type}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 rounded bg-orange-50 text-orange-600 font-bold text-xs">{a.questions?.length ?? 0}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-gray-700">{a.passing_score}%</td>
                                        <td className="px-6 py-4 text-center text-gray-500">{a.time_limit_minutes > 0 ? `${a.time_limit_minutes} min` : '∞'}</td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                                            <Link href={lockedCourseId ? `/admin/courses/${lockedCourseId}/assessments/${a.id}/questions` : `/admin/assessments/${a.id}/questions`} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-md text-xs font-bold transition-colors inline-block">Questions</Link>
                                            {canManage && (
                                            <button onClick={() => openEdit(a)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md text-xs font-bold transition-colors inline-block">Edit</button>
                                            )}
                                            {canManage && (
                                            <button onClick={() => handleDelete(a)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md text-xs font-bold transition-colors inline-block">Delete</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalCount > pageSize && !filterType && (
                    <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                        <span className="text-sm text-gray-500">Showing {filtered.length} of {totalCount} assessments</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <Button variant="outline" size="sm" disabled={(page * pageSize) >= totalCount} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                title="Edit Assessment"
                maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Title" placeholder="e.g. Phishing Awareness Quiz" value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })} disabled={isActionLoading} autoFocus />
                        <Input label="Passing Score (%)" type="number" value={form.passing_score.toString()}
                            onChange={e => setForm({ ...form, passing_score: parseInt(e.target.value) || 0 })}
                            required disabled={isActionLoading} />
                    </div>

                    <div>
                        <label className={LABEL_CLS}>Description</label>
                        <textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px] resize-y"
                            placeholder="Brief description of this assessment…"
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            disabled={isActionLoading} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLS}>Time Limit (minutes)</label>
                            <input type="number" className={SELECT_CLS} value={form.time_limit_minutes}
                                onChange={e => setForm({ ...form, time_limit_minutes: parseInt(e.target.value) || 0 })}
                                placeholder="0 = no limit" disabled={isActionLoading} />
                            <p className="text-[10px] text-gray-400 mt-1">Set to 0 for no time limit.</p>
                        </div>
                        <div className="flex items-center gap-3 mt-6">
                            <input type="checkbox" id="shuffle" className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                checked={form.shuffle_questions} onChange={e => setForm({ ...form, shuffle_questions: e.target.checked })}
                                disabled={isActionLoading} />
                            <label htmlFor="shuffle" className="text-sm font-semibold text-gray-700 cursor-pointer">Shuffle Questions</label>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                        <strong>Note:</strong> To manage questions for this assessment, use the <strong>Questions</strong> button in the table row.
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>
                            {isActionLoading ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Assessment"
                message="Are you sure? This will permanently remove the assessment and all its questions, choices, and attempt history."
                confirmText="Delete" isLoading={isActionLoading} />
        </div>
    );
}
