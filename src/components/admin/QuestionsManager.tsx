'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
 Assessment, AssessmentQuestion, AssessmentChoice, QuestionType,
 getAssessment, getAssessmentQuestions, createAssessmentQuestion,
 updateAssessmentQuestion, deleteAssessmentQuestion,
 createAssessmentChoice, updateAssessmentChoice, deleteAssessmentChoice,
 createAssessmentMatchingPair, updateAssessmentMatchingPair, deleteAssessmentMatchingPair,
 createAssessmentOrderingItem, updateAssessmentOrderingItem, deleteAssessmentOrderingItem,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';
import { Plus, Trash2, ArrowDownUp, Link as LinkIcon } from 'lucide-react';

const SELECT_CLS = 'block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card';
const LBL = 'block text-sm font-semibold text-foreground mb-1';

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
 { value: 'multiple_choice', label: 'Multiple Choice', icon: '⭕' },
 { value: 'multiple_select', label: 'Multiple Select', icon: '☑️' },
 { value: 'true_false', label: 'True / False', icon: '✅' },
 { value: 'fill_blank', label: 'Fill in Blank', icon: '✏️' },
 { value: 'short_answer', label: 'Short Answer', icon: '📝' },
 { value: 'essay', label: 'Essay', icon: '📄' },
 { value: 'matching', label: 'Matching', icon: '🔗' },
 { value: 'ordering', label: 'Ordering', icon: '🔢' },
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

type QFormState = {
  type: QuestionType;
  prompt: string; explanation: string; points: number; order: number;
  is_required: boolean; case_sensitive: boolean;
  correct_text_answer: string; allow_multiple_selection: boolean;
  choices: { id?: string; text: string; is_correct: boolean; order: number }[];
  matching_pairs: { id?: string; left_text: string; right_text: string; order?: number }[];
  ordering_items: { id?: string; text: string; correct_order: number; order?: number }[];
};

const getDefaultForm = (order: number): QFormState => ({
  type: 'multiple_choice', prompt: '', explanation: '', points: 1, order,
  is_required: true, case_sensitive: false, correct_text_answer: '', allow_multiple_selection: false,
  choices: [{ text: '', is_correct: true, order: 1 }, { text: '', is_correct: false, order: 2 }],
  matching_pairs: [{ left_text: '', right_text: '' }, { left_text: '', right_text: '' }],
  ordering_items: [{ text: '', correct_order: 1 }, { text: '', correct_order: 2 }]
});

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
 
 const [createForms, setCreateForms] = useState<QFormState[]>([getDefaultForm(1)]);
 const [editForm, setEditForm] = useState<QFormState>(getDefaultForm(1));

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
 const nextOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order)) + 1 : 1;
 setCreateForms([getDefaultForm(nextOrder)]);
 }
 setIsCreateExpanded(!isCreateExpanded);
 };

 const addCreateForm = () => {
 const maxExisting = questions.length > 0 ? Math.max(...questions.map(q => q.order)) : 0;
 const nextOrder = maxExisting + createForms.length + 1;
 setCreateForms([...createForms, getDefaultForm(nextOrder)]);
 };

 const removeCreateForm = (index: number) => {
 if (createForms.length > 1) {
 setCreateForms(createForms.filter((_, i) => i !== index));
 }
 };

 const updateCreateForm = (index: number, updates: Partial<QFormState>) => {
 const newForms = [...createForms];
 newForms[index] = { ...newForms[index], ...updates };
 setCreateForms(newForms);
 };

 const handleTypeChange = (newType: QuestionType, currentForm: QFormState, onChange: (updates: Partial<QFormState>) => void) => {
 let defaultChoices = currentForm.choices;
 let defaultPairs = currentForm.matching_pairs;
 let defaultOrderItems = currentForm.ordering_items;
 
 const wasTrueFalse = currentForm.type === 'true_false';
 
 if (newType === 'true_false') {
 defaultChoices = [
 { text: 'True', is_correct: true, order: 1 },
 { text: 'False', is_correct: false, order: 2 }
 ];
 } else if (wasTrueFalse) {
 defaultChoices = [{ text: '', is_correct: true, order: 1 }, { text: '', is_correct: false, order: 2 }];
 }
 
 if (newType === 'matching' && defaultPairs.length === 0) {
 defaultPairs = [{ left_text: '', right_text: '' }, { left_text: '', right_text: '' }];
 }
 
 if (newType === 'ordering' && defaultOrderItems.length === 0) {
 defaultOrderItems = [{ text: '', correct_order: 1 }, { text: '', correct_order: 2 }];
 }
 
 onChange({ type: newType, choices: defaultChoices, matching_pairs: defaultPairs, ordering_items: defaultOrderItems });
 };

 const openEditQ = (q: AssessmentQuestion) => {
 setSelectedQ(q); setActionError(''); setIsCreateExpanded(false);
 setEditForm({
 type: q.type, prompt: q.prompt, explanation: q.explanation, points: q.points, order: q.order,
 is_required: q.is_required, case_sensitive: q.case_sensitive, correct_text_answer: q.correct_text_answer,
 allow_multiple_selection: q.allow_multiple_selection,
 choices: q.choices ? q.choices.map(c => ({ id: c.id, text: c.text, is_correct: c.is_correct, order: c.order })) : [],
 matching_pairs: q.matching_pairs ? q.matching_pairs.map(p => ({ id: p.id, left_text: p.left_text, right_text: p.right_text, order: p.order })) : [],
 ordering_items: q.ordering_items ? q.ordering_items.map(o => ({ id: o.id, text: o.text, correct_order: o.order, order: o.order })) : []
 });
 setIsQModalOpen(true);
 };

 const handleCreateBatchSubmit = async (e: React.FormEvent) => {
 e.preventDefault(); setActionError(''); setIsActionLoading(true);

 let successCount = 0;
 for (let i = 0; i < createForms.length; i++) {
 const form = createForms[i];
 const payload = {
 assessment: assessmentId,
 type: form.type,
 prompt: form.prompt,
 order: form.order,
 explanation: form.explanation || undefined,
 points: form.points,
 is_required: form.is_required,
 case_sensitive: NEEDS_TEXT_ANSWER.includes(form.type) ? form.case_sensitive : undefined,
 correct_text_answer: NEEDS_TEXT_ANSWER.includes(form.type) ? form.correct_text_answer : undefined,
 allow_multiple_selection: form.type === 'multiple_select' ? true : undefined,
 };

 const { error: err, data } = await createAssessmentQuestion(payload);
 if (err) {
 setActionError(`Error saving Question ${i + 1}: ${err}`);
 setIsActionLoading(false);
 if (successCount > 0) fetchData();
 return;
 }

 const qId = data?.id;
 if (qId) {
 if (NEEDS_CHOICES.includes(form.type)) {
 for (const c of form.choices) {
 await createAssessmentChoice({ question: qId, text: c.text, is_correct: c.is_correct, order: c.order });
 }
 } else if (form.type === 'matching') {
 for (const [idx, p] of form.matching_pairs.entries()) {
 await createAssessmentMatchingPair({ question: qId, left_text: p.left_text, right_text: p.right_text, order: idx + 1 });
 }
 } else if (form.type === 'ordering') {
 for (const [idx, o] of form.ordering_items.entries()) {
 await createAssessmentOrderingItem({ question: qId, text: o.text, order: idx + 1 });
 }
 }
 }
 successCount++;
 }

 setIsCreateExpanded(false);
 fetchData();
 setIsActionLoading(false);
 };

 const handleEditSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedQ) return;
 setActionError(''); setIsActionLoading(true);

 const payload = {
 assessment: assessmentId,
 type: editForm.type,
 prompt: editForm.prompt,
 order: editForm.order,
 explanation: editForm.explanation || undefined,
 points: editForm.points,
 is_required: editForm.is_required,
 case_sensitive: NEEDS_TEXT_ANSWER.includes(editForm.type) ? editForm.case_sensitive : undefined,
 correct_text_answer: NEEDS_TEXT_ANSWER.includes(editForm.type) ? editForm.correct_text_answer : undefined,
 allow_multiple_selection: editForm.type === 'multiple_select' ? true : undefined,
 };

 const { error: err } = await updateAssessmentQuestion(selectedQ.id, payload);
 if (err) { setActionError(err); setIsActionLoading(false); return; }

 if (NEEDS_CHOICES.includes(editForm.type)) {
 const oldChoices = selectedQ.choices || [];
 const newChoices = editForm.choices;
 const newChoiceIds = new Set(newChoices.map(c => c.id).filter(Boolean));
 const choicesToDelete = oldChoices.filter(c => !newChoiceIds.has(c.id));
 
 for (const c of choicesToDelete) await deleteAssessmentChoice(c.id);
 
 for (const c of newChoices) {
 if (c.id) {
 const oldC = oldChoices.find(oc => oc.id === c.id);
 if (!oldC || oldC.text !== c.text || oldC.is_correct !== c.is_correct || oldC.order !== c.order) {
 await updateAssessmentChoice(c.id, { text: c.text, is_correct: c.is_correct, order: c.order });
 }
 } else {
 await createAssessmentChoice({ question: selectedQ.id, text: c.text, is_correct: c.is_correct, order: c.order });
 }
 }
 } else if (editForm.type === 'matching') {
 const oldPairs = selectedQ.matching_pairs || [];
 const newPairs = editForm.matching_pairs;
 const newIds = new Set(newPairs.map(p => p.id).filter(Boolean));
 const toDelete = oldPairs.filter(p => !newIds.has(p.id));
 
 for (const p of toDelete) await deleteAssessmentMatchingPair(p.id);
 
 for (const [idx, p] of newPairs.entries()) {
 const order = idx + 1;
 if (p.id) {
 const oldP = oldPairs.find(op => op.id === p.id);
 if (!oldP || oldP.left_text !== p.left_text || oldP.right_text !== p.right_text || oldP.order !== order) {
 await updateAssessmentMatchingPair(p.id, { left_text: p.left_text, right_text: p.right_text, order });
 }
 } else {
 await createAssessmentMatchingPair({ question: selectedQ.id, left_text: p.left_text, right_text: p.right_text, order });
 }
 }
 } else if (editForm.type === 'ordering') {
 const oldItems = selectedQ.ordering_items || [];
 const newItems = editForm.ordering_items;
 const newIds = new Set(newItems.map(o => o.id).filter(Boolean));
 const toDelete = oldItems.filter(o => !newIds.has(o.id));
 
 for (const o of toDelete) await deleteAssessmentOrderingItem(o.id);
 
 for (const [idx, o] of newItems.entries()) {
 const order = idx + 1;
 if (o.id) {
 const oldO = oldItems.find(oo => oo.id === o.id);
 if (!oldO || oldO.text !== o.text || oldO.order !== order) {
 await updateAssessmentOrderingItem(o.id, { text: o.text, order });
 }
 } else {
 await createAssessmentOrderingItem({ question: selectedQ.id, text: o.text, order });
 }
 }
 }

 setIsQModalOpen(false);
 fetchData();
 setIsActionLoading(false);
 };

 const confirmDeleteQ = async () => {
 if (!qToDelete) return; setIsActionLoading(true);
 await deleteAssessmentQuestion(qToDelete.id);
 fetchData(); setIsDeleteQOpen(false); setQToDelete(null); setIsActionLoading(false);
 };

 const renderFormFields = (
 form: QFormState,
 onChange: (updates: Partial<QFormState>) => void,
 onTypeChange: (type: QuestionType) => void,
 isEditMode: boolean
 ) => {
 const updateChoice = (index: number, field: keyof QFormState['choices'][0], value: any) => {
 const newChoices = [...form.choices];
 if (field === 'is_correct' && form.type !== 'multiple_select') {
 newChoices.forEach(c => c.is_correct = false);
 }
 newChoices[index] = { ...newChoices[index], [field]: value };
 onChange({ choices: newChoices });
 };
 const addChoice = () => onChange({ choices: [...form.choices, { text: '', is_correct: false, order: form.choices.length + 1 }] });
 const removeChoice = (index: number) => {
 const newChoices = form.choices.filter((_, i) => i !== index);
 newChoices.forEach((c, i) => c.order = i + 1);
 onChange({ choices: newChoices });
 };

 const updatePair = (index: number, field: 'left_text' | 'right_text', value: string) => {
 const newPairs = [...form.matching_pairs];
 newPairs[index] = { ...newPairs[index], [field]: value };
 onChange({ matching_pairs: newPairs });
 };
 const addPair = () => onChange({ matching_pairs: [...form.matching_pairs, { left_text: '', right_text: '' }] });
 const removePair = (index: number) => onChange({ matching_pairs: form.matching_pairs.filter((_, i) => i !== index) });

 const updateOrder = (index: number, text: string) => {
 const newItems = [...form.ordering_items];
 newItems[index] = { ...newItems[index], text };
 onChange({ ordering_items: newItems });
 };
 const addOrder = () => onChange({ ordering_items: [...form.ordering_items, { text: '', correct_order: form.ordering_items.length + 1 }] });
 const removeOrder = (index: number) => {
 const newItems = form.ordering_items.filter((_, i) => i !== index);
 newItems.forEach((c, i) => c.correct_order = i + 1);
 onChange({ ordering_items: newItems });
 };

 const renderChoicesBuilder = () => {
 if (form.type === 'matching') {
 return (
 <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50 space-y-3 mt-4">
 <div className="flex justify-between items-center mb-2">
 <p className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2"><LinkIcon className="size-4" /> Matching Pairs</p>
 </div>
 <div className="space-y-2">
 {form.matching_pairs.map((p, i) => (
 <div key={i} className="flex flex-col md:flex-row items-center gap-3 p-3 bg-card border border-border rounded-xl">
 <div className="flex-1 w-full relative">
 <input type="text" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:outline-none" placeholder="Term / Prompt (Left side)" value={p.left_text} onChange={(e) => updatePair(i, 'left_text', e.target.value)} disabled={isActionLoading} required />
 </div>
 <div className="text-muted-foreground rotate-90 md:rotate-0">➔</div>
 <div className="flex-1 w-full relative">
 <input type="text" className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:outline-none" placeholder="Definition / Match (Right side)" value={p.right_text} onChange={(e) => updatePair(i, 'right_text', e.target.value)} disabled={isActionLoading} required />
 </div>
 <button type="button" onClick={() => removePair(i)} disabled={isActionLoading || form.matching_pairs.length <= 2} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
 <Trash2 className="size-4" />
 </button>
 </div>
 ))}
 </div>
 <button type="button" onClick={addPair} disabled={isActionLoading} className="mt-2 w-full py-2 border-2 border-dashed border-purple-200 rounded-xl text-sm font-semibold text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-colors flex items-center justify-center gap-2 cursor-pointer">
 <Plus className="size-4" /> Add Matching Pair
 </button>
 </div>
 );
 }

 if (form.type === 'ordering') {
 return (
 <div className="border border-pink-200 rounded-xl p-4 bg-pink-50/50 space-y-3 mt-4">
 <div className="flex justify-between items-center mb-2">
 <p className="text-xs font-bold text-pink-700 uppercase tracking-wider flex items-center gap-2"><ArrowDownUp className="size-4" /> Ordering Sequence</p>
 <span className="text-xs text-pink-500 font-medium">Define items in their correct order</span>
 </div>
 <div className="space-y-2">
 {form.ordering_items.map((o, i) => (
 <div key={i} className="flex items-center gap-3 p-2 bg-card border border-border rounded-xl">
 <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm shrink-0">{i + 1}</div>
 <input type="text" className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none" placeholder={`Step ${i + 1}`} value={o.text} onChange={(e) => updateOrder(i, e.target.value)} disabled={isActionLoading} required />
 <button type="button" onClick={() => removeOrder(i)} disabled={isActionLoading || form.ordering_items.length <= 2} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
 <Trash2 className="size-4" />
 </button>
 </div>
 ))}
 </div>
 <button type="button" onClick={addOrder} disabled={isActionLoading} className="mt-2 w-full py-2 border-2 border-dashed border-pink-200 rounded-xl text-sm font-semibold text-pink-600 hover:bg-pink-50 hover:border-pink-300 transition-colors flex items-center justify-center gap-2 cursor-pointer">
 <Plus className="size-4" /> Add Step
 </button>
 </div>
 );
 }

 if (!NEEDS_CHOICES.includes(form.type)) return null;

 if (form.type === 'true_false') {
 return (
 <div className="border border-green-200 rounded-xl p-4 bg-green-50 space-y-3 mt-4">
 <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">True / False Answer</p>
 {form.choices.map((c, i) => (
 <label key={i} className="flex items-center gap-3 p-3 bg-card border border-green-200 rounded-xl cursor-pointer hover:bg-green-50 transition-colors">
 <input type="radio" name={`tf_correct_${form.order}`} className="text-green-600 focus:ring-green-500 w-4 h-4"
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
 {form.type === 'multiple_select' ? 'Select all correct answers' : 'Select the correct answer'}
 </span>
 </div>
 <div className="space-y-2">
 {form.choices.map((c, i) => (
 <div key={i} className={`flex items-center gap-3 p-2 bg-card border rounded-xl ${c.is_correct ? 'border-green-400 ring-1 ring-green-400 shadow-sm shadow-black/5 dark:shadow-none' : 'border-border'}`}>
 <div className="flex-shrink-0 pl-2">
 <input type={form.type === 'multiple_select' ? 'checkbox' : 'radio'} name={`choice_correct_${form.type}_${form.order}`} className={`w-4 h-4 text-green-600 focus:ring-green-500 ${form.type === 'multiple_choice' ? 'rounded-full' : 'rounded'}`} checked={c.is_correct} onChange={(e) => updateChoice(i, 'is_correct', e.target.checked)} disabled={isActionLoading} />
 </div>
 <input type="text" className="flex-1 px-3 py-1.5 text-sm border-0 focus:ring-0 bg-transparent" placeholder={`Choice ${i + 1}`} value={c.text} onChange={(e) => updateChoice(i, 'text', e.target.value)} disabled={isActionLoading} required />
 <button type="button" onClick={() => removeChoice(i)} disabled={isActionLoading || form.choices.length <= 2} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
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

 return (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className={LBL}>Question Type <span className="text-primary">*</span></label>
 <select className={SELECT_CLS} value={form.type} onChange={e => onTypeChange(e.target.value as QuestionType)} disabled={isActionLoading || isEditMode} required>
 {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
 </select>
 {isEditMode && <p className="text-[10px] text-muted-foreground mt-1">Type cannot be changed after creation.</p>}
 </div>
 <div className="grid grid-cols-2 gap-2">
 <Input label="Points" type="number" value={form.points.toString()} onChange={e => onChange({ points: parseInt(e.target.value) || 1 })} disabled={isActionLoading} />
 <Input label="Order" type="number" value={form.order.toString()} onChange={e => onChange({ order: parseInt(e.target.value) || 1 })} required disabled={isActionLoading} />
 </div>
 </div>

 <div>
 <label className={LBL}>Question Prompt <span className="text-primary">*</span></label>
 <textarea className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:border-primary focus:ring-1 outline-none min-h-[80px] resize-y"
 placeholder="Enter your question here…" value={form.prompt} onChange={e => onChange({ prompt: e.target.value })} required disabled={isActionLoading} />
 </div>

 <div>
 <label className={LBL}>Explanation <span className="text-muted-foreground font-normal">(shown after answering)</span></label>
 <textarea className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:border-primary focus:ring-1 outline-none min-h-[60px] resize-y"
 placeholder="Why is this the correct answer?…" value={form.explanation} onChange={e => onChange({ explanation: e.target.value })} disabled={isActionLoading} />
 </div>

 {NEEDS_TEXT_ANSWER.includes(form.type) && (
 <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50 space-y-3">
 <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Fill-in-the-Blank Answer</p>
 <Input label="Correct Text Answer" value={form.correct_text_answer} onChange={e => onChange({ correct_text_answer: e.target.value })} placeholder="e.g. Paris" disabled={isActionLoading} required />
 <label className="flex items-center gap-2 text-sm text-yellow-800 cursor-pointer">
 <input type="checkbox" className="rounded border-yellow-400" checked={form.case_sensitive} onChange={e => onChange({ case_sensitive: e.target.checked })} disabled={isActionLoading} />
 Case-sensitive grading
 </label>
 </div>
 )}

 {renderChoicesBuilder()}

 {MANUAL_GRADED.includes(form.type) && (
 <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-yellow-700">
 <strong>Manual Grading Required:</strong> {form.type === 'short_answer' ? 'Short answer' : 'Essay'} questions must be graded by an instructor after submission.
 </div>
 )}

 <div className="flex items-center gap-2">
 <input type="checkbox" className="rounded border-border text-primary focus:ring-primary cursor-pointer" checked={form.is_required} onChange={e => onChange({ is_required: e.target.checked })} disabled={isActionLoading} />
 <label className="text-sm font-semibold text-foreground cursor-pointer" onClick={() => !isActionLoading && onChange({ is_required: !form.is_required })}>Required question</label>
 </div>
 </div>
 );
 };

 if (isFetching) return <div className="flex justify-center items-center min-h-[30vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

 return (
 <div>
 {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

 <ExpandableCreateSection
 title="Add Question(s)"
 isOpen={isCreateExpanded}
 onToggle={toggleCreateQ}
 >
 <form onSubmit={handleCreateBatchSubmit} className="space-y-6">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

 <div className="space-y-6">
 {createForms.map((form, index) => (
 <div key={index} className="relative p-5 border border-border rounded-xl bg-gray-50/30">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-foreground flex items-center gap-2">
 <span className="bg-primary/10 text-primary w-6 h-6 flex items-center justify-center rounded-full text-xs">{index + 1}</span>
 Question {index + 1}
 </h4>
 {createForms.length > 1 && (
 <button type="button" onClick={() => removeCreateForm(index)} disabled={isActionLoading} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50">
 <Trash2 className="size-4" /> Remove
 </button>
 )}
 </div>
 {renderFormFields(
 form,
 (updates) => updateCreateForm(index, updates),
 (type) => handleTypeChange(type, form, (updates) => updateCreateForm(index, updates)),
 false
 )}
 </div>
 ))}
 </div>

 <button type="button" onClick={addCreateForm} disabled={isActionLoading} className="w-full py-3 border-2 border-dashed border-primary/20 rounded-xl text-sm font-semibold text-primary hover:bg-primary/5 hover:border-primary/40 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
 <Plus className="size-4" /> Add Another Question
 </button>

 <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
 <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>
 {isActionLoading ? 'Saving Batch...' : `Add Questions (${createForms.length})`}
 </Button>
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
 
 {q.type === 'matching' && q.matching_pairs && q.matching_pairs.length > 0 && (
 <div className="border-t border-border px-6 py-4 bg-purple-50/30">
 <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-3">Matching Pairs</p>
 <div className="grid gap-2">
 {q.matching_pairs.map(p => (
 <div key={p.id} className="flex items-center gap-3 text-sm">
 <div className="flex-1 bg-card border border-border px-3 py-2 rounded-lg">{p.left_text}</div>
 <div className="text-muted-foreground">➔</div>
 <div className="flex-1 bg-card border border-border px-3 py-2 rounded-lg">{p.right_text}</div>
 </div>
 ))}
 </div>
 </div>
 )}

 {q.type === 'ordering' && q.ordering_items && q.ordering_items.length > 0 && (
 <div className="border-t border-border px-6 py-4 bg-pink-50/30">
 <p className="text-xs font-bold text-pink-700 uppercase tracking-wider mb-3">Correct Order Sequence</p>
 <div className="flex flex-col gap-2 relative">
 <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-pink-200" />
 {q.ordering_items.sort((a, b) => a.correct_order - b.correct_order).map(o => (
 <div key={o.id} className="flex items-center gap-4 relative z-10">
 <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 border-2 border-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">{o.correct_order}</div>
 <div className="flex-1 bg-card border border-border px-4 py-2 rounded-lg text-sm">{o.text}</div>
 </div>
 ))}
 </div>
 </div>
 )}

 </div>
 ))}
 </div>
 )}

 <Modal isOpen={isQModalOpen} onClose={() => setIsQModalOpen(false)} title="Edit Question" maxWidth="2xl">
 <form onSubmit={handleEditSubmit} className="space-y-6">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}
 
 {renderFormFields(
 editForm,
 (updates) => setEditForm({ ...editForm, ...updates }),
 (type) => handleTypeChange(type, editForm, (updates) => setEditForm({ ...editForm, ...updates })),
 true
 )}

 <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
 <Button type="button" variant="outline" onClick={() => setIsQModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving...' : 'Save Changes'}</Button>
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
