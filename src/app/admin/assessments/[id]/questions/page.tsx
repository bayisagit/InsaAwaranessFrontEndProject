'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
    Assessment, AssessmentQuestion, AssessmentChoice, QuestionType,
    getAssessment, getAssessmentQuestions, createAssessmentQuestion,
    updateAssessmentQuestion, deleteAssessmentQuestion,
    getAssessmentChoices, createAssessmentChoice, updateAssessmentChoice, deleteAssessmentChoice,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';

const SELECT_CLS = 'block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white';
const LBL = 'block text-sm font-semibold text-gray-700 mb-1';

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
    { value: 'multiple_choice', label: 'Multiple Choice', icon: '⭕' },
    { value: 'multiple_select', label: 'Multiple Select', icon: '☑️' },
    { value: 'true_false', label: 'True / False', icon: '✅' },
    { value: 'fill_blank', label: 'Fill in Blank', icon: '✏️' },
    { value: 'short_answer', label: 'Short Answer', icon: '📝' },
    { value: 'essay', label: 'Essay', icon: '📄' },
    { value: 'matching', label: 'Matching (legacy)', icon: '🔗' },
    { value: 'ordering', label: 'Ordering (legacy)', icon: '🔢' },
];

const TYPE_BADGE: Record<QuestionType, string> = {
    multiple_choice: 'bg-blue-50 text-blue-700',
    multiple_select: 'bg-cyan-50 text-cyan-700',
    true_false: 'bg-green-50 text-green-700',
    fill_blank: 'bg-yellow-50 text-yellow-700',
    short_answer: 'bg-orange-50 text-orange-700',
    essay: 'bg-red-50 text-red-700',
    matching: 'bg-purple-50 text-purple-700',
    ordering: 'bg-pink-50 text-pink-700',
};

const NEEDS_CHOICES: QuestionType[] = ['multiple_choice', 'multiple_select', 'true_false'];
const NEEDS_TEXT_ANSWER: QuestionType[] = ['fill_blank'];
const MANUAL_GRADED: QuestionType[] = ['short_answer', 'essay'];

export default function AssessmentQuestionsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const assessmentId = typeof params?.id === 'string' ? params.id : '';

    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');

    // Question modal
    const [isQModalOpen, setIsQModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selectedQ, setSelectedQ] = useState<AssessmentQuestion | null>(null);
    const [qForm, setQForm] = useState({
        type: 'multiple_choice' as QuestionType,
        prompt: '', explanation: '', points: 1, order: 1,
        is_required: true, case_sensitive: false,
        correct_text_answer: '', allow_multiple_selection: false,
    });

    // Choice modal (for choice-based types)
    const [choiceTarget, setChoiceTarget] = useState<AssessmentQuestion | null>(null);
    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [choiceForm, setChoiceForm] = useState({ text: '', is_correct: false, order: 1 });
    const [selectedChoice, setSelectedChoice] = useState<AssessmentChoice | null>(null);

    // Delete modals
    const [isDeleteQOpen, setIsDeleteQOpen] = useState(false);
    const [qToDelete, setQToDelete] = useState<AssessmentQuestion | null>(null);
    const [isDeleteChoiceOpen, setIsDeleteChoiceOpen] = useState(false);
    const [choiceToDelete, setChoiceToDelete] = useState<AssessmentChoice | null>(null);

    const fetchData = useCallback(async () => {
        if (!assessmentId) return;
        setIsFetching(true); setError('');
        const [aRes, qRes] = await Promise.all([
            getAssessment(assessmentId),
            getAssessmentQuestions({ assessment: assessmentId, ordering: 'order', page_size: 100 }),
        ]);
        if (aRes.error) { setError(aRes.error); setIsFetching(false); return; }
        if (aRes.data) setAssessment(aRes.data);
        const qs = qRes.data?.results ?? (Array.isArray(qRes.data) ? qRes.data : []);
        setQuestions(qs);
        setIsFetching(false);
    }, [assessmentId]);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (!['super_admin', 'course_provider'].includes(user?.role || '')) router.push('/dashboard');
            else fetchData();
        }
    }, [isAuthenticated, isLoading, user, router, fetchData]);

    // ── Question CRUD ──────────────────────────────────────────
    const openCreateQ = () => {
        setSelectedQ(null); setActionError('');
        setQForm({ type: 'multiple_choice', prompt: '', explanation: '', points: 1, order: questions.length + 1, is_required: true, case_sensitive: false, correct_text_answer: '', allow_multiple_selection: false });
        setIsQModalOpen(true);
    };

    const openEditQ = (q: AssessmentQuestion) => {
        setSelectedQ(q); setActionError('');
        setQForm({ type: q.type, prompt: q.prompt, explanation: q.explanation, points: q.points, order: q.order, is_required: q.is_required, case_sensitive: q.case_sensitive, correct_text_answer: q.correct_text_answer, allow_multiple_selection: q.allow_multiple_selection });
        setIsQModalOpen(true);
    };

    const handleQSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setActionError(''); setIsActionLoading(true);
        const payload = {
            assessment: assessmentId,
            type: qForm.type,
            prompt: qForm.prompt,
            order: qForm.order,
            explanation: qForm.explanation || undefined,
            points: qForm.points,
            is_required: qForm.is_required,
            case_sensitive: NEEDS_TEXT_ANSWER.includes(qForm.type) ? qForm.case_sensitive : undefined,
            correct_text_answer: NEEDS_TEXT_ANSWER.includes(qForm.type) ? qForm.correct_text_answer : undefined,
            allow_multiple_selection: qForm.type === 'multiple_select' ? true : undefined,
        };
        const { error: err, data } = selectedQ
            ? await updateAssessmentQuestion(selectedQ.id, payload)
            : await createAssessmentQuestion(payload);
        if (err) { setActionError(err); setIsActionLoading(false); return; }

        // Auto-create True/False choices for new true_false questions
        if (!selectedQ && qForm.type === 'true_false' && data) {
            await createAssessmentChoice({ question: data.id, text: 'True', is_correct: true, order: 1 });
            await createAssessmentChoice({ question: data.id, text: 'False', is_correct: false, order: 2 });
        }
        setIsQModalOpen(false); fetchData();
        setIsActionLoading(false);
    };

    const confirmDeleteQ = async () => {
        if (!qToDelete) return; setIsActionLoading(true);
        await deleteAssessmentQuestion(qToDelete.id);
        fetchData(); setIsDeleteQOpen(false); setQToDelete(null); setIsActionLoading(false);
    };

    // ── Choice CRUD ────────────────────────────────────────────
    const openManageChoices = (q: AssessmentQuestion) => { setChoiceTarget(q); setSelectedChoice(null); setChoiceForm({ text: '', is_correct: false, order: (q.choices?.length ?? 0) + 1 }); setIsChoiceModalOpen(true); };

    const openEditChoice = (q: AssessmentQuestion, c: AssessmentChoice) => { setChoiceTarget(q); setSelectedChoice(c); setChoiceForm({ text: c.text, is_correct: c.is_correct, order: c.order }); setIsChoiceModalOpen(true); };

    const handleChoiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setActionError(''); setIsActionLoading(true);
        if (!choiceTarget) return;
        const { error: err } = selectedChoice
            ? await updateAssessmentChoice(selectedChoice.id, { text: choiceForm.text, is_correct: choiceForm.is_correct, order: choiceForm.order })
            : await createAssessmentChoice({ question: choiceTarget.id, text: choiceForm.text, is_correct: choiceForm.is_correct, order: choiceForm.order });
        if (err) { setActionError(err); setIsActionLoading(false); return; }
        setSelectedChoice(null); setChoiceForm({ text: '', is_correct: false, order: (choiceTarget.choices?.length ?? 0) + 2 });
        fetchData(); setIsActionLoading(false);
    };

    const confirmDeleteChoice = async () => {
        if (!choiceToDelete) return; setIsActionLoading(true);
        await deleteAssessmentChoice(choiceToDelete.id);
        fetchData();
        // Refresh choiceTarget's choices too
        if (choiceTarget) {
            const { data } = await getAssessmentQuestions({ assessment: assessmentId, ordering: 'order', page_size: 100 });
            const updated = (data?.results ?? []).find(q => q.id === choiceTarget.id);
            if (updated) setChoiceTarget(updated);
        }
        setIsDeleteChoiceOpen(false); setChoiceToDelete(null); setIsActionLoading(false);
    };

    if (isLoading || isFetching) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                    <button onClick={() => router.back()} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest mb-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Assessments
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{assessment?.title || 'Assessment Questions'}</h1>
                            <p className="text-gray-500 mt-1">
                                {assessment?.passing_score}% pass score · {(assessment?.time_limit_minutes ?? 0) > 0 ? `${assessment?.time_limit_minutes} min` : 'No time limit'} · <span className="capitalize">{assessment?.parent_type?.replace('_', ' ')}</span>
                            </p>
                        </div>
                        <Button variant="primary" onClick={openCreateQ}>+ Add Question</Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                {questions.length === 0 ? (
                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
                        <div className="text-5xl mb-4 opacity-20">❓</div>
                        <p className="text-gray-500 font-semibold mb-2">No questions yet</p>
                        <p className="text-gray-400 text-sm mb-6">Add your first question using the button above.</p>
                        <Button variant="outline" onClick={openCreateQ}>Add First Question</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questions.sort((a, b) => a.order - b.order).map((q, idx) => (
                            <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Question header */}
                                <div className="flex items-start gap-4 p-6">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">{idx + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${TYPE_BADGE[q.type]}`}>
                                                {QUESTION_TYPES.find(t => t.value === q.type)?.icon} {QUESTION_TYPES.find(t => t.value === q.type)?.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                                            {q.requires_manual_grading && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-600">Manual Grading</span>}
                                            {!q.is_required && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">Optional</span>}
                                        </div>
                                        <p className="text-gray-900 font-semibold text-sm leading-relaxed">{q.prompt}</p>
                                        {q.explanation && <p className="text-gray-500 text-xs mt-1 italic">Explanation: {q.explanation}</p>}
                                        {NEEDS_TEXT_ANSWER.includes(q.type) && q.correct_text_answer && (
                                            <p className="text-green-600 text-xs mt-1 font-semibold">✓ Answer: {q.correct_text_answer} {q.case_sensitive ? '(case-sensitive)' : ''}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {NEEDS_CHOICES.includes(q.type) && (
                                            <button onClick={() => openManageChoices(q)} className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-bold transition-colors">
                                                Choices ({q.choices?.length ?? 0})
                                            </button>
                                        )}
                                        <button onClick={() => openEditQ(q)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors">Edit</button>
                                        <button onClick={() => { setQToDelete(q); setIsDeleteQOpen(true); }} className="text-red-500 hover:text-red-700 font-semibold text-sm transition-colors">Delete</button>
                                    </div>
                                </div>

                                {/* Inline choices preview */}
                                {NEEDS_CHOICES.includes(q.type) && q.choices && q.choices.length > 0 && (
                                    <div className="border-t border-gray-100 px-6 py-3 bg-gray-50/50">
                                        <div className="flex flex-wrap gap-2">
                                            {q.choices.sort((a, b) => a.order - b.order).map(c => (
                                                <span key={c.id} className={`px-3 py-1 rounded-full text-xs font-semibold border ${c.is_correct ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                                                    {c.is_correct ? '✓ ' : ''}{c.text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Question Create/Edit Modal */}
            <Modal isOpen={isQModalOpen} onClose={() => setIsQModalOpen(false)} title={selectedQ ? 'Edit Question' : 'Add Question'} maxWidth="2xl">
                <form onSubmit={handleQSubmit} className="space-y-4">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LBL}>Question Type <span className="text-primary">*</span></label>
                            <select className={SELECT_CLS} value={qForm.type} onChange={e => setQForm({ ...qForm, type: e.target.value as QuestionType })} disabled={!!selectedQ || isActionLoading} required>
                                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                            </select>
                            {selectedQ && <p className="text-[10px] text-gray-400 mt-1">Type cannot be changed after creation.</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Points" type="number" value={qForm.points} onChange={e => setQForm({ ...qForm, points: parseInt(e.target.value) || 1 })} disabled={isActionLoading} />
                            <Input label="Order" type="number" value={qForm.order} onChange={e => setQForm({ ...qForm, order: parseInt(e.target.value) || 1 })} required disabled={isActionLoading} />
                        </div>
                    </div>

                    <div>
                        <label className={LBL}>Question Prompt <span className="text-primary">*</span></label>
                        <textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 outline-none min-h-[80px] resize-y"
                            placeholder="Enter your question here…" value={qForm.prompt} onChange={e => setQForm({ ...qForm, prompt: e.target.value })} required disabled={isActionLoading} />
                    </div>

                    <div>
                        <label className={LBL}>Explanation <span className="text-gray-400 font-normal">(shown after answering)</span></label>
                        <textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:border-primary focus:ring-1 outline-none min-h-[60px] resize-y"
                            placeholder="Why is this the correct answer?…" value={qForm.explanation} onChange={e => setQForm({ ...qForm, explanation: e.target.value })} disabled={isActionLoading} />
                    </div>

                    {/* fill_blank specific */}
                    {NEEDS_TEXT_ANSWER.includes(qForm.type) && (
                        <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 space-y-3">
                            <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Fill-in-the-Blank Answer</p>
                            <Input label="Correct Text Answer" value={qForm.correct_text_answer} onChange={e => setQForm({ ...qForm, correct_text_answer: e.target.value })} placeholder="e.g. Paris" disabled={isActionLoading} required />
                            <label className="flex items-center gap-2 text-sm text-yellow-800 cursor-pointer">
                                <input type="checkbox" className="rounded border-yellow-400" checked={qForm.case_sensitive} onChange={e => setQForm({ ...qForm, case_sensitive: e.target.checked })} />
                                Case-sensitive grading
                            </label>
                        </div>
                    )}

                    {/* choice-based type info */}
                    {NEEDS_CHOICES.includes(qForm.type) && !selectedQ && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                            <strong>Next step:</strong> After creating this question, click <strong>Choices</strong> to add answer options.
                            {qForm.type === 'true_false' && ' True/False choices will be auto-created.'}
                        </div>
                    )}

                    {MANUAL_GRADED.includes(qForm.type) && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-700">
                            <strong>Manual Grading Required:</strong> {qForm.type === 'short_answer' ? 'Short answer' : 'Essay'} questions must be graded by an instructor after submission.
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_required" className="rounded border-gray-300 text-primary focus:ring-primary" checked={qForm.is_required} onChange={e => setQForm({ ...qForm, is_required: e.target.checked })} />
                        <label htmlFor="is_required" className="text-sm font-semibold text-gray-700 cursor-pointer">Required question</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => setIsQModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving…' : selectedQ ? 'Save Changes' : 'Create Question'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Choices Modal */}
            <Modal isOpen={isChoiceModalOpen} onClose={() => setIsChoiceModalOpen(false)} title={`Choices — ${choiceTarget?.prompt?.substring(0, 50) || ''}…`} maxWidth="2xl">
                <div className="space-y-6">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}

                    {/* Existing choices */}
                    {choiceTarget && choiceTarget.choices && choiceTarget.choices.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Existing Choices</p>
                            <div className="space-y-2">
                                {choiceTarget.choices.sort((a, b) => a.order - b.order).map(c => (
                                    <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border ${c.is_correct ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                        <span className={`text-xs font-bold w-16 shrink-0 ${c.is_correct ? 'text-green-600' : 'text-gray-400'}`}>{c.is_correct ? '✓ Correct' : 'Wrong'}</span>
                                        <span className="flex-1 text-sm text-gray-800">{c.text}</span>
                                        <span className="text-[10px] text-gray-400 w-10">#{c.order}</span>
                                        <button onClick={() => openEditChoice(choiceTarget, c)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Edit</button>
                                        <button onClick={() => { setChoiceToDelete(c); setIsDeleteChoiceOpen(true); }} className="text-red-500 hover:text-red-700 text-xs font-bold">Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add/edit choice form */}
                    <form onSubmit={handleChoiceSubmit} className="border-t border-gray-100 pt-4 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{selectedChoice ? 'Edit Choice' : 'Add New Choice'}</p>
                        <Input label="Choice Text" value={choiceForm.text} onChange={e => setChoiceForm({ ...choiceForm, text: e.target.value })} placeholder="Option text…" required disabled={isActionLoading} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Order" type="number" value={choiceForm.order} onChange={e => setChoiceForm({ ...choiceForm, order: parseInt(e.target.value) || 1 })} required disabled={isActionLoading} />
                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" checked={choiceForm.is_correct} onChange={e => setChoiceForm({ ...choiceForm, is_correct: e.target.checked })} />
                                    Mark as Correct
                                </label>
                            </div>
                        </div>
                        {choiceTarget?.type === 'multiple_choice' && (
                            <p className="text-[10px] text-amber-600">Multiple choice: exactly one choice must be correct.</p>
                        )}
                        {choiceTarget?.type === 'true_false' && (
                            <p className="text-[10px] text-amber-600">True/False: set "True" as correct=true and "False" as correct=false.</p>
                        )}
                        <div className="flex justify-end gap-3">
                            {selectedChoice && <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedChoice(null); setChoiceForm({ text: '', is_correct: false, order: (choiceTarget?.choices?.length ?? 0) + 1 }); }}>Cancel Edit</Button>}
                            <Button type="submit" variant="primary" size="sm" disabled={isActionLoading}>{isActionLoading ? 'Saving…' : selectedChoice ? 'Update' : 'Add Choice'}</Button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmModal isOpen={isDeleteQOpen} onClose={() => setIsDeleteQOpen(false)} onConfirm={confirmDeleteQ} title="Delete Question" message="Delete this question and all its choices? This cannot be undone." confirmText="Delete" isLoading={isActionLoading} />
            <ConfirmModal isOpen={isDeleteChoiceOpen} onClose={() => setIsDeleteChoiceOpen(false)} onConfirm={confirmDeleteChoice} title="Delete Choice" message="Are you sure you want to delete this choice?" confirmText="Delete" isLoading={isActionLoading} />
        </div>
    );
}
