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
    CertificateExam,
    getAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getCourses,
    getModules,
    getLessons,
    getCertificateExams,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';

const SELECT_CLS = 'block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white';
const LABEL_CLS = 'block text-sm font-semibold text-gray-700 mb-1';

type ParentType = 'lesson' | 'certificate_exam';

export default function AdminAssessmentsPage() {
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
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selectedItem, setSelectedItem] = useState<Assessment | null>(null);

    // Cascading selects for create
    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [certExams, setCertExams] = useState<CertificateExam[]>([]);

    const [form, setForm] = useState({
        parent_type: 'lesson' as ParentType,
        course_id: '',
        module_id: '',
        lesson_id: '',
        cert_exam_id: '',
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
        const { data, error: e } = await getAssessments(params);
        if (e) setError(e);
        else if (data?.results) { setAssessments(data.results); setTotalCount(data.count); }
        setIsFetching(false);
    }, [page]);

    const fetchCourses = useCallback(async () => {
        const { data } = await getCourses({ page_size: 100 });
        setCourses(data?.results ?? []);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (!['super_admin', 'course_provider'].includes(user?.role || '')) router.push('/dashboard');
            else { fetchAssessments(); fetchCourses(); }
        }
    }, [isAuthenticated, isLoading, user, router, fetchAssessments, fetchCourses]);

    useEffect(() => {
        if (!isModalOpen || !form.course_id) { setModules([]); setLessons([]); setCertExams([]); return; }
        getModules({ course: form.course_id, page_size: 100 }).then(({ data }) => setModules(data?.results ?? []));
        if (form.parent_type === 'certificate_exam') {
            getCertificateExams({ course: form.course_id, page_size: 100 }).then(({ data }) =>
                setCertExams(data?.results ?? (Array.isArray(data) ? data : [])));
        }
    }, [form.course_id, form.parent_type, isModalOpen]);

    useEffect(() => {
        if (!isModalOpen || !form.module_id || form.parent_type !== 'lesson') { setLessons([]); return; }
        getLessons({ module: form.module_id, page_size: 100 }).then(({ data }) => setLessons(data?.results ?? []));
    }, [form.module_id, form.parent_type, isModalOpen]);

    const resetForm = () => setForm({
        parent_type: 'lesson', course_id: '', module_id: '', lesson_id: '', cert_exam_id: '',
        title: '', description: '', passing_score: 70, time_limit_minutes: 0, shuffle_questions: false,
    });

    const openCreate = () => {
        setSelectedItem(null); setActionError(''); resetForm(); setIsModalOpen(true);
    };

    const openEdit = (a: Assessment) => {
        setSelectedItem(a); setActionError('');
        setForm(f => ({
            ...f,
            parent_type: a.parent_type === 'lesson' ? 'lesson' : 'certificate_exam',
            title: a.title, description: a.description,
            passing_score: a.passing_score, time_limit_minutes: a.time_limit_minutes,
            shuffle_questions: a.shuffle_questions,
        }));
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setActionError(''); setIsActionLoading(true);
        try {
            if (selectedItem) {
                // Edit — only metadata fields
                const { error: err } = await updateAssessment(selectedItem.id, {
                    title: form.title, description: form.description,
                    passing_score: form.passing_score, time_limit_minutes: form.time_limit_minutes,
                    shuffle_questions: form.shuffle_questions,
                });
                if (err) { setActionError(err); setIsActionLoading(false); return; }
            } else {
                // Create — exactly one parent
                const payload: Parameters<typeof createAssessment>[0] = {
                    title: form.title || undefined, description: form.description || undefined,
                    passing_score: form.passing_score, time_limit_minutes: form.time_limit_minutes,
                    shuffle_questions: form.shuffle_questions,
                };
                if (form.parent_type === 'lesson') {
                    if (!form.lesson_id) { setActionError('Please select a lesson.'); setIsActionLoading(false); return; }
                    payload.lesson = form.lesson_id;
                } else {
                    if (!form.cert_exam_id) { setActionError('Please select a certificate exam.'); setIsActionLoading(false); return; }
                    payload.certificate_exam = form.cert_exam_id;
                }
                const { error: err } = await createAssessment(payload);
                if (err) { setActionError(err); setIsActionLoading(false); return; }
            }
            setIsModalOpen(false); fetchAssessments();
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

    const filtered = filterType ? assessments.filter(a => a.parent_type === filterType) : assessments;

    if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
    if (!user || !['super_admin', 'course_provider'].includes(user.role)) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Assessment Management</h1>
                        <p className="text-gray-500">Create and manage module quizzes and certificate exams.</p>
                    </div>
                    <Button variant="primary" onClick={openCreate}>+ New Assessment</Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                {/* Type filter */}
                <div className="flex gap-3 mb-6">
                    {(['', 'lesson', 'certificate_exam'] as const).map(t => (
                        <button key={t} onClick={() => setFilterType(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${filterType === t ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                            {t === '' ? 'All' : t === 'lesson' ? '📝 Lesson Quizzes' : '🎓 Certificate Exams'}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isFetching ? (
                        <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Type</th>
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
                                        <p className="text-gray-400 text-xs mt-1">Click "+ New Assessment" to create the first one.</p>
                                    </td></tr>
                                ) : filtered.map(a => (
                                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{a.title || <span className="text-gray-400 italic">Untitled</span>}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${a.parent_type === 'lesson' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                {a.parent_type === 'lesson' ? 'Quiz' : 'Certificate Exam'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 rounded bg-orange-50 text-orange-600 font-bold text-xs">{a.questions?.length ?? 0}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-gray-700">{a.passing_score}%</td>
                                        <td className="px-6 py-4 text-center text-gray-500">{a.time_limit_minutes > 0 ? `${a.time_limit_minutes} min` : '∞'}</td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                                            <Link href={`/admin/assessments/${a.id}/questions`} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors">Questions</Link>
                                            <button onClick={() => openEdit(a)} className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">Edit</button>
                                            <button onClick={() => handleDelete(a)} className="text-red-500 hover:text-red-700 font-semibold transition-colors">Delete</button>
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

            {/* Create / Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                title={selectedItem ? 'Edit Assessment' : 'New Assessment'}
                maxWidth="2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}

                    {/* Parent type — only for create */}
                    {!selectedItem && (
                        <div>
                            <label className={LABEL_CLS}>Assessment Type <span className="text-primary">*</span></label>
                            <div className="flex gap-3">
                                {(['lesson', 'certificate_exam'] as ParentType[]).map(t => (
                                    <button key={t} type="button"
                                        onClick={() => setForm({ ...form, parent_type: t, lesson_id: '', cert_exam_id: '' })}
                                        className={`flex-1 py-2.5 px-4 rounded-lg border font-semibold text-sm transition-all ${form.parent_type === t ? 'bg-primary text-white border-primary shadow' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                        {t === 'lesson' ? '📝 Module Quiz' : '🎓 Certificate Exam'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Title" placeholder="e.g. Phishing Awareness Quiz" value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })} disabled={isActionLoading} />
                        <Input label="Passing Score (%)" type="number" value={form.passing_score}
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
                    {!selectedItem && (
                        <div className="border-t border-gray-100 pt-5 space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Link to Parent</p>

                            <div>
                                <label className={LABEL_CLS}>Course <span className="text-primary">*</span></label>
                                <select className={SELECT_CLS} value={form.course_id} required disabled={isActionLoading}
                                    onChange={e => setForm({ ...form, course_id: e.target.value, module_id: '', lesson_id: '', cert_exam_id: '' })}>
                                    <option value="">Select course</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>

                            {form.parent_type === 'lesson' && (
                                <>
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

                            {form.parent_type === 'certificate_exam' && (
                                <div>
                                    <label className={LABEL_CLS}>Certificate Exam <span className="text-primary">*</span></label>
                                    <select className={SELECT_CLS} value={form.cert_exam_id} required disabled={!form.course_id || isActionLoading}
                                        onChange={e => setForm({ ...form, cert_exam_id: e.target.value })}>
                                        <option value="">Select certificate exam</option>
                                        {certExams.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedItem && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                            <strong>Note:</strong> To manage questions for this assessment, use the <strong>Questions</strong> button in the table row.
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>
                            {isActionLoading ? 'Saving…' : selectedItem ? 'Save Changes' : 'Create Assessment'}
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
