'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
 Assessment, AssessmentQuestion, AssessmentChoice, QuestionType,
 getAssessment, getAssessmentQuestions, createAssessmentQuestion,
 updateAssessmentQuestion, deleteAssessmentQuestion,
 createAssessmentChoice, updateAssessmentChoice, deleteAssessmentChoice,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';
import { Plus, Trash2 } from 'lucide-react';

const SELECT_CLS = 'block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card';
const LBL = 'block text-sm font-semibold text-foreground mb-1';

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

interface QuestionsManagerProps {
 assessmentId: string;
}

export function QuestionsManager({ assessmentId }: QuestionsManagerProps) {
 const [assessment, setAssessment] = useState<Assessment | null>(null);
 const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
 const [isFetching, setIsFetching] = useState(true);
 const [error, setError] = useState('');

 const [isQModalOpen, setIsQModalOpen] = useState(false);
 const [isCreateExpanded, setIsCreateExpanded] = useState(false);
 const [isActionLoading, setIsActionLoading] = useState(false);
 const [actionError, setActionError] = useState('');
 const [selectedQ, setSelectedQ] = useState<AssessmentQuestion | null>(null);
 const [qForm, setQForm] = useState({
 type: 'multiple_choice' as QuestionType,
 prompt: '', explanation: '', points: 1, order: 1,
 is_required: true, case_sensitive: false,
 correct_text_answer: '', allow_multiple_selection: false,
 choices: [] as { id?: string; text: string; is_correct: boolean; order: number }[],
 });

 const [isDeleteQOpen, setIsDeleteQOpen] = useState(false);
 const [qToDelete, setQToDelete] = useState<AssessmentQuestion | null>(null);

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

 useEffect(() => { fetchData(); }, [fetchData]);

 useEffect(() => {
 if (typeof window !== 'undefined') {
 const params = new URLSearchParams(window.location.search);
 if (params.get('create') === 'true') {
 setIsCreateExpanded(true);
 }
 }
 }, []);

 const toggleCreateQ = () => {
 if (!isCreateExpanded) {
 setSelectedQ(null); setActionError('');
 setQForm({
 type: 'multiple_choice', prompt: '', explanation: '', points: 1, order: questions.length + 1,
 is_required: true, case_sensitive: false, correct_text_answer: '', allow_multiple_selection: false,
 choices: [{ text: '', is_correct: true, order: 1 }, { text: '', is_correct: false, order: 2 }]
 });
 }
 setIsCreateExpanded(!isCreateExpanded);
 };

 const handleTypeChange = (newType: QuestionType) => {
 let defaultChoices = qForm.choices;
 const wasTrueFalse = qForm.type === 'true_false';
 if (newType === 'true_false') {
 defaultChoices = [
 { text: 'True', is_correct: true, order: 1 },
 { text: 'False', is_correct: false, order: 2 }
 ];
 } else if (wasTrueFalse) {
 defaultChoices = [{ text: '', is_correct: true, order: 1 }, { text: '', is_correct: false, order: 2 }];
 }
 setQForm({ ...qForm, type: newType, choices: defaultChoices });
 };

 const openEditQ = (q: AssessmentQuestion) => {
 setSelectedQ(q); setActionError(''); setIsCreateExpanded(false);
 setQForm({
 type: q.type, prompt: q.prompt, explanation: q.explanation, points: q.points, order: q.order,
 is_required: q.is_required, case_sensitive: q.case_sensitive, correct_text_answer: q.correct_text_answer,
 allow_multiple_selection: q.allow_multiple_selection,
 choices: q.choices ? q.choices.map(c => ({ id: c.id, text: c.text, is_correct: c.is_correct, order: c.order })) : []
 });
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

 const qId = selectedQ ? selectedQ.id : data?.id;

 if (qId && NEEDS_CHOICES.includes(qForm.type)) {
 const oldChoices = selectedQ?.choices || [];
 const newChoices = qForm.choices;

 const newChoiceIds = new Set(newChoices.map(c => c.id).filter(Boolean));
 const choicesToDelete = oldChoices.filter(c => !newChoiceIds.has(c.id));

 for (const c of choicesToDelete) {
 await deleteAssessmentChoice(c.id);
 }

 for (const c of newChoices) {
 if (c.id) {
 const oldC = oldChoices.find(oc => oc.id === c.id);
 if (!oldC || oldC.text !== c.text || oldC.is_correct !== c.is_correct || oldC.order !== c.order) {
 await updateAssessmentChoice(c.id, { text: c.text, is_correct: c.is_correct, order: c.order });
 }
 } else {
 await createAssessmentChoice({ question: qId, text: c.text, is_correct: c.is_correct, order: c.order });
 }
 }
 }

 if (selectedQ) {
 setIsQModalOpen(false);
 } else {
 setIsCreateExpanded(false);
 }
 fetchData();
 setIsActionLoading(false);
 };

 const confirmDeleteQ = async () => {
 if (!qToDelete) return; setIsActionLoading(true);
 await deleteAssessmentQuestion(qToDelete.id);
 fetchData(); setIsDeleteQOpen(false); setQToDelete(null); setIsActionLoading(false);
 };

 const renderChoicesBuilder = () => {
 if (!NEEDS_CHOICES.includes(qForm.type)) return null;

 const updateChoice = (index: number, field: keyof typeof qForm.choices[0], value: any) => {
 const newChoices = [...qForm.choices];
 if (field === 'is_correct' && qForm.type !== 'multiple_select') {
 newChoices.forEach(c => c.is_correct = false);
 }
 newChoices[index] = { ...newChoices[index], [field]: value };
 setQForm({ ...qForm, choices: newChoices });
 };

 const addChoice = () => {
 setQForm({ ...qForm, choices: [...qForm.choices, { text: '', is_correct: false, order: qForm.choices.length + 1 }] });
 };

 const removeChoice = (index: number) => {
 const newChoices = qForm.choices.filter((_, i) => i !== index);
 newChoices.forEach((c, i) => c.order = i + 1);
 setQForm({ ...qForm, choices: newChoices });
 };

 if (qForm.type === 'true_false') {
 return (
 <div className="border border-green-200 rounded-xl p-4 bg-green-50 space-y-3 mt-4">
 <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">True / False Answer</p>
 {qForm.choices.map((c, i) => (
 <label key={i} className="flex items-center gap-3 p-3 bg-card border border-green-200 rounded-xl cursor-pointer hover:bg-green-50 transition-colors">
 <input type="radio" name="tf_correct" className="text-green-600 focus:ring-green-500 w-4 h-4"
 checked={c.is_correct} onChange={() => updateChoice(i, 'is_correct', true)} disabled={isActionLoading} />
 <span className="text-sm font-bold text-foreground">{c.text}</span>
 </label>
 ))}
 </div>
 );
 }

 return (
 <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50 space-y-3 mt-4">
 <div className="flex justify-between items-center mb-2">
 <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Answer Choices</p>
 <span className="text-xs text-blue-500 font-medium">
 {qForm.type === 'multiple_select' ? 'Select all correct answers' : 'Select the correct answer'}
 </span>
 </div>

 <div className="space-y-2">
 {qForm.choices.map((c, i) => (
 <div key={i} className={`flex items-center gap-3 p-2 bg-card border rounded-xl ${c.is_correct ? 'border-green-400 ring-1 ring-green-400 shadow-sm shadow-black/5 dark:shadow-none' : 'border-border'}`}>
 <div className="flex-shrink-0 pl-2">
 <input
 type={qForm.type === 'multiple_select' ? 'checkbox' : 'radio'}
 name={`choice_correct_${qForm.type}`}
 className={`w-4 h-4 text-green-600 focus:ring-green-500 ${qForm.type === 'multiple_choice' ? 'rounded-full' : 'rounded'}`}
 checked={c.is_correct}
 onChange={(e) => updateChoice(i, 'is_correct', e.target.checked)}
 disabled={isActionLoading}
 />
 </div>
 <input
 type="text"
 className="flex-1 px-3 py-1.5 text-sm border-0 focus:ring-0 bg-transparent"
 placeholder={`Choice ${i + 1}`}
 value={c.text}
 onChange={(e) => updateChoice(i, 'text', e.target.value)}
 disabled={isActionLoading}
 required
 />
 <button type="button" onClick={() => removeChoice(i)} disabled={isActionLoading || qForm.choices.length <= 2} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
 <Trash2 className="size-4" />
 </button>
 </div>
 ))}
 </div>

 <button type="button" onClick={addChoice} disabled={isActionLoading} className="mt-2 w-full py-2 border-2 border-dashed border-blue-200 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-2 cursor-pointer">
 <Plus className="size-4" /> Add Option
 </button>
 </div>
 );
 };

 if (isFetching) return <div className="flex justify-center items-center min-h-[30vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

 return (
 <div>
 {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

 <ExpandableCreateSection
 title="Add Question"
 isOpen={isCreateExpanded}
 onToggle={toggleCreateQ}
 >
 <form onSubmit={handleQSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className={LBL}>Question Type <span className="text-primary">*</span></label>
 <select className={SELECT_CLS} value={qForm.type} onChange={e => handleTypeChange(e.target.value as QuestionType)} disabled={isActionLoading} required>
 {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <Input label="Points" type="number" value={qForm.points.toString()} onChange={e => setQForm({ ...qForm, points: parseInt(e.target.value) || 1 })} disabled={isActionLoading} />
 <Input label="Order" type="number" value={qForm.order.toString()} onChange={e => setQForm({ ...qForm, order: parseInt(e.target.value) || 1 })} required disabled={isActionLoading} />
 </div>
 </div>

 <div>
 <label className={LBL}>Question Prompt <span className="text-primary">*</span></label>
 <textarea className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:border-primary focus:ring-1 outline-none min-h-[80px] resize-y"
 placeholder="Enter your question here…" value={qForm.prompt} onChange={e => setQForm({ ...qForm, prompt: e.target.value })} required disabled={isActionLoading} autoFocus />
 </div>

 <div>
 <label className={LBL}>Explanation <span className="text-muted-foreground font-normal">(shown after answering)</span></label>
 <textarea className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:border-primary focus:ring-1 outline-none min-h-[60px] resize-y"
 placeholder="Why is this the correct answer?…" value={qForm.explanation} onChange={e => setQForm({ ...qForm, explanation: e.target.value })} disabled={isActionLoading} />
 </div>

 {NEEDS_TEXT_ANSWER.includes(qForm.type) && (
 <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50 space-y-3">
 <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Fill-in-the-Blank Answer</p>
 <Input label="Correct Text Answer" value={qForm.correct_text_answer} onChange={e => setQForm({ ...qForm, correct_text_answer: e.target.value })} placeholder="e.g. Paris" disabled={isActionLoading} required />
 <label className="flex items-center gap-2 text-sm text-yellow-800 cursor-pointer">
 <input type="checkbox" className="rounded border-yellow-400" checked={qForm.case_sensitive} onChange={e => setQForm({ ...qForm, case_sensitive: e.target.checked })} />
 Case-sensitive grading
 </label>
 </div>
 )}

 {renderChoicesBuilder()}

 {MANUAL_GRADED.includes(qForm.type) && (
 <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-yellow-700">
 <strong>Manual Grading Required:</strong> {qForm.type === 'short_answer' ? 'Short answer' : 'Essay'} questions must be graded by an instructor after submission.
 </div>
 )}

 <div className="flex items-center gap-2">
 <input type="checkbox" id="is_required_create" className="rounded border-border text-primary focus:ring-primary" checked={qForm.is_required} onChange={e => setQForm({ ...qForm, is_required: e.target.checked })} />
 <label htmlFor="is_required_create" className="text-sm font-semibold text-foreground cursor-pointer">Required question</label>
 </div>

 <div className="pt-4 flex justify-end gap-3 border-t border-border">
 <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving...' : 'Create Question'}</Button>
 </div>
 </form>
 </ExpandableCreateSection>

 {questions.length === 0 ? (
 <div className="bg-card rounded-xl border-2 border-dashed border-border p-16 text-center">
 <div className="text-5xl mb-4 opacity-20">❓</div>
 <p className="text-muted-foreground font-semibold mb-2">No questions yet</p>
 <p className="text-muted-foreground text-sm mb-6">Add your first question using the section above.</p>
 <Button variant="outline" onClick={toggleCreateQ}>Add First Question</Button>
 </div>
 ) : (
 <div className="space-y-4">
 {questions.sort((a, b) => a.order - b.order).map((q, idx) => (
 <div key={q.id} className="bg-card rounded-xl border border-border shadow-sm shadow-black/5 dark:shadow-none overflow-hidden">
 <div className="flex items-start gap-4 p-6">
 <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">{idx + 1}</div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-2 flex-wrap">
 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${TYPE_BADGE[q.type]}`}>
 {QUESTION_TYPES.find(t => t.value === q.type)?.icon} {QUESTION_TYPES.find(t => t.value === q.type)?.label}
 </span>
 <span className="text-[10px] text-muted-foreground font-medium">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
 {q.requires_manual_grading && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-600">Manual Grading</span>}
 {!q.is_required && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted/50 text-muted-foreground">Optional</span>}
 </div>
 <p className="text-foreground font-semibold text-sm leading-relaxed">{q.prompt}</p>
 {q.explanation && <p className="text-muted-foreground text-xs mt-1 italic">Explanation: {q.explanation}</p>}
 {NEEDS_TEXT_ANSWER.includes(q.type) && q.correct_text_answer && (
 <p className="text-green-600 text-xs mt-1 font-semibold">✓ Answer: {q.correct_text_answer} {q.case_sensitive ? '(case-sensitive)' : ''}</p>
 )}
 </div>
 <div className="flex gap-2 shrink-0">
 <button onClick={() => openEditQ(q)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">Edit</button>
 <button onClick={() => { setQToDelete(q); setIsDeleteQOpen(true); }} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">Delete</button>
 </div>
 </div>

 {NEEDS_CHOICES.includes(q.type) && q.choices && q.choices.length > 0 && (
 <div className="border-t border-border px-6 py-3 bg-gray-50/50">
 <div className="flex flex-wrap gap-2">
 {q.choices.sort((a, b) => a.order - b.order).map(c => (
 <span key={c.id} className={`px-3 py-1 rounded-full text-xs font-semibold border ${c.is_correct ? 'bg-green-50 border-green-200 text-green-700' : 'bg-card border-border text-muted-foreground'}`}>
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

 <Modal isOpen={isQModalOpen} onClose={() => setIsQModalOpen(false)} title="Edit Question" maxWidth="2xl">
 <form onSubmit={handleQSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className={LBL}>Question Type <span className="text-primary">*</span></label>
 <select className={SELECT_CLS} value={qForm.type} onChange={e => setQForm({ ...qForm, type: e.target.value as QuestionType })} disabled={true} required>
 {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
 </select>
 <p className="text-[10px] text-muted-foreground mt-1">Type cannot be changed after creation.</p>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <Input label="Points" type="number" value={qForm.points.toString()} onChange={e => setQForm({ ...qForm, points: parseInt(e.target.value) || 1 })} disabled={isActionLoading} />
 <Input label="Order" type="number" value={qForm.order.toString()} onChange={e => setQForm({ ...qForm, order: parseInt(e.target.value) || 1 })} required disabled={isActionLoading} />
 </div>
 </div>

 <div>
 <label className={LBL}>Question Prompt <span className="text-primary">*</span></label>
 <textarea className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:border-primary focus:ring-1 outline-none min-h-[80px] resize-y"
 placeholder="Enter your question here…" value={qForm.prompt} onChange={e => setQForm({ ...qForm, prompt: e.target.value })} required disabled={isActionLoading} autoFocus />
 </div>

 <div>
 <label className={LBL}>Explanation <span className="text-muted-foreground font-normal">(shown after answering)</span></label>
 <textarea className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:border-primary focus:ring-1 outline-none min-h-[60px] resize-y"
 placeholder="Why is this the correct answer?…" value={qForm.explanation} onChange={e => setQForm({ ...qForm, explanation: e.target.value })} disabled={isActionLoading} />
 </div>

 {NEEDS_TEXT_ANSWER.includes(qForm.type) && (
 <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50 space-y-3">
 <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Fill-in-the-Blank Answer</p>
 <Input label="Correct Text Answer" value={qForm.correct_text_answer} onChange={e => setQForm({ ...qForm, correct_text_answer: e.target.value })} placeholder="e.g. Paris" disabled={isActionLoading} required />
 <label className="flex items-center gap-2 text-sm text-yellow-800 cursor-pointer">
 <input type="checkbox" className="rounded border-yellow-400" checked={qForm.case_sensitive} onChange={e => setQForm({ ...qForm, case_sensitive: e.target.checked })} />
 Case-sensitive grading
 </label>
 </div>
 )}

 {renderChoicesBuilder()}

 {MANUAL_GRADED.includes(qForm.type) && (
 <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-yellow-700">
 <strong>Manual Grading Required:</strong> {qForm.type === 'short_answer' ? 'Short answer' : 'Essay'} questions must be graded by an instructor after submission.
 </div>
 )}

 <div className="flex items-center gap-2">
 <input type="checkbox" id="is_required" className="rounded border-border text-primary focus:ring-primary" checked={qForm.is_required} onChange={e => setQForm({ ...qForm, is_required: e.target.checked })} />
 <label htmlFor="is_required" className="text-sm font-semibold text-foreground cursor-pointer">Required question</label>
 </div>

 <div className="pt-4 flex justify-end gap-3 border-t border-border">
 <Button type="button" variant="outline" onClick={() => setIsQModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving…' : 'Save Changes'}</Button>
 </div>
 </form>
 </Modal>

 <ConfirmModal
 isOpen={isDeleteQOpen}
 title="Delete Question"
 message={`Are you sure you want to delete "${qToDelete?.prompt}"? This action cannot be undone.`}
 onConfirm={confirmDeleteQ}
 onClose={() => setIsDeleteQOpen(false)}
 isLoading={isActionLoading}
 confirmText="Delete"
 />
 </div>
 );
}
