'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentAnswer,
    getAssessment, getAssessments,
    startAssessment, resumeAssessment, saveAssessmentProgress, submitAssessment, getAssessmentAttempts,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { LinkifyText } from '@/components/LinkifyText';

// ─── Props ──────────────────────────────────────────────────────────────────────
// Accepts either a direct assessmentId or a lessonId / certificateExamId to look up
interface AssessmentViewerProps {
    assessmentId?: string;
    lessonId?: string;
    certificateExamId?: string;
    onComplete?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────
function hydrateAnswers(attempt: AssessmentAttempt, questions: AssessmentQuestion[]): Record<string, any> {
    const saved: Record<string, any> = {};
    for (const ans of attempt.answers) {
        const q = questions.find(q => q.id === ans.question);
        if (!q) continue;
        if (['multiple_choice', 'multiple_select', 'true_false'].includes(q.type)) {
            saved[ans.question] = ans.response_json?.choice_ids ?? [];
        } else if (q.type === 'matching') {
            saved[ans.question] = ans.response_json?.pairs ?? {};
        } else if (q.type === 'ordering') {
            saved[ans.question] = ans.response_json?.order ?? [];
        } else {
            saved[ans.question] = ans.response_text ?? '';
        }
    }
    return saved;
}

function formatAnswerForApi(q: AssessmentQuestion, raw: any): any {
    if (['multiple_choice', 'multiple_select', 'true_false'].includes(q.type)) {
        return Array.isArray(raw) ? raw : (raw ? [raw] : []);
    }
    if (q.type === 'matching') return typeof raw === 'object' && !Array.isArray(raw) ? { pairs: raw } : raw;
    if (q.type === 'ordering') return Array.isArray(raw) ? { order: raw } : raw;
    return raw ?? '';
}

export function AssessmentViewer({ assessmentId: propAssessmentId, lessonId, certificateExamId, onComplete }: AssessmentViewerProps) {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [result, setResult] = useState<AssessmentAttempt | null>(null);
    const [history, setHistory] = useState<AssessmentAttempt[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const assessmentIdRef = useRef<string | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── 1. Load assessment ────────────────────────────────────────────────────────
    const loadAssessment = useCallback(async () => {
        setIsLoading(true); setLoadError('');
        let id = propAssessmentId;

        if (!id && lessonId) {
            const { data } = await getAssessments({ lesson: lessonId, page_size: 1 });
            id = data?.results?.[0]?.id;
        } else if (!id && certificateExamId) {
            id = certificateExamId;
        }

        if (!id) { setLoadError('No assessment found for this lesson.'); setIsLoading(false); return; }
        assessmentIdRef.current = id;

        const { data: aData, error: aErr } = await getAssessment(id);
        if (aErr || !aData) { setLoadError(aErr || 'Failed to load assessment.'); setIsLoading(false); return; }
        setAssessment(aData);

        // 2. Resume or Start
        const { data: resumeData, status: resumeStatus } = await resumeAssessment(id);
        if (resumeStatus === 200 && resumeData) {
            setAttempt(resumeData);
            const hydrated = hydrateAnswers(resumeData, aData.questions);
            setAnswers(hydrated);
            setCurrentIndex(resumeData.current_question_index ?? 0);
        } else {
            const { data: startData, error: startErr } = await startAssessment(id);
            if (startErr || !startData) { setLoadError(startErr || 'Failed to start assessment.'); setIsLoading(false); return; }
            setAttempt(startData);
        }

        // 3. Load history
        const { data: hist } = await getAssessmentAttempts(id);
        setHistory(Array.isArray(hist) ? hist : []);

        setIsLoading(false);
    }, [propAssessmentId, lessonId, certificateExamId]);

    useEffect(() => { loadAssessment(); }, [loadAssessment]);

    // ── Auto-save on answer change ────────────────────────────────────────────────
    const scheduleSave = useCallback((qId: string, answer: any, index: number) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            const aId = assessmentIdRef.current;
            if (!aId) return;
            setIsSaving(true);
            const q = assessment?.questions.find(q => q.id === qId);
            if (q) await saveAssessmentProgress(aId, { question_id: qId, answer: formatAnswerForApi(q, answer), current_question_index: index });
            setIsSaving(false);
        }, 800);
    }, [assessment]);

    const handleAnswer = (qId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
        scheduleSave(qId, value, currentIndex);
    };

    const handleMultiSelectToggle = (qId: string, choiceId: string) => {
        setAnswers(prev => {
            const current: string[] = Array.isArray(prev[qId]) ? prev[qId] : [];
            const next = current.includes(choiceId) ? current.filter(x => x !== choiceId) : [...current, choiceId];
            scheduleSave(qId, next, currentIndex);
            return { ...prev, [qId]: next };
        });
    };

    const handleMatchingPair = (qId: string, left: string, right: string) => {
        setAnswers(prev => {
            const next = { ...(prev[qId] || {}), [left]: right };
            scheduleSave(qId, next, currentIndex);
            return { ...prev, [qId]: next };
        });
    };

    // ── Navigate ──────────────────────────────────────────────────────────────────
    const navigate = async (nextIndex: number) => {
        const aId = assessmentIdRef.current;
        if (aId) await saveAssessmentProgress(aId, { current_question_index: nextIndex });
        setCurrentIndex(nextIndex);
    };

    // ── Submit ────────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const aId = assessmentIdRef.current;
        if (!aId || !assessment) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setIsSubmitting(true); setSubmitError('');

        const finalAnswers: Record<string, any> = {};
        for (const q of assessment.questions) {
            const raw = answers[q.id];
            if (raw !== undefined) finalAnswers[q.id] = formatAnswerForApi(q, raw);
        }

        const { data, error: err, status } = await submitAssessment(aId, finalAnswers);
        if (err || !data || !([200, 201].includes(status ?? 0))) {
            setSubmitError(err || `Submission failed (status ${status}).`);
            setIsSubmitting(false); return;
        }
        setResult(data);
        // Refresh history
        const { data: hist } = await getAssessmentAttempts(aId);
        setHistory(Array.isArray(hist) ? hist : []);
        if (onComplete) onComplete();
        setIsSubmitting(false);
    };

    // ── Retake ────────────────────────────────────────────────────────────────────
    const handleRetake = async () => {
        setResult(null); setAnswers({}); setCurrentIndex(0); setSubmitError('');
        const aId = assessmentIdRef.current;
        if (!aId) return;
        setIsLoading(true);
        const { data, error: err } = await startAssessment(aId);
        if (err || !data) { setLoadError(err || 'Failed to start new attempt.'); setIsLoading(false); return; }
        setAttempt(data); setIsLoading(false);
    };

    // ── Render ────────────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
    );

    if (loadError) return (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">{loadError}</div>
    );

    if (!assessment || !assessment.questions?.length) return (
        <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-500">
            <div className="text-4xl mb-2 opacity-20">📝</div>
            No questions have been added to this assessment yet.
        </div>
    );

    const questions = assessment.questions;
    const currentQ = questions[currentIndex];

    // ── Result view ───────────────────────────────────────────────────────────────
    if (result) {
        const isPendingReview = result.status === 'needs_review';
        const passed = result.passed && !isPendingReview;

        return (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Result header */}
                <div className={`px-6 py-8 text-center ${passed ? 'bg-green-50' : isPendingReview ? 'bg-yellow-50' : 'bg-red-50'}`}>
                    <div className="text-5xl mb-3">{passed ? '🏆' : isPendingReview ? '⏳' : '📚'}</div>
                    {isPendingReview ? (
                        <><h3 className="text-xl font-bold text-yellow-800 mb-1">Pending Review</h3>
                            <p className="text-yellow-700 text-sm">Your answers include questions that require manual grading. Results will be updated once reviewed by an instructor.</p></>
                    ) : (
                        <><h3 className={`text-xl font-bold mb-1 ${passed ? 'text-green-800' : 'text-red-800'}`}>{passed ? 'Well done! You passed!' : 'Keep practicing!'}</h3>
                            <p className={`text-sm ${passed ? 'text-green-700' : 'text-red-700'}`}>
                                Score: <strong>{result.score.toFixed(1)}%</strong> (Pass mark: {assessment.passing_score}%)
                            </p></>
                    )}
                </div>

                {/* Per-answer breakdown */}
                <div className="p-6 space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Answer Review</h4>
                    {result.answers.map(ans => {
                        const q = questions.find(q => q.id === ans.question);
                        if (!q) return null;
                        const isPending = ans.requires_manual_grading;
                        return (
                            <div key={ans.id} className={`p-4 rounded-xl border ${isPending ? 'border-yellow-200 bg-yellow-50' : ans.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                <div className="flex justify-between items-start gap-3">
                                    <p className="text-sm font-semibold text-gray-900 flex-1"><LinkifyText text={q.prompt} /></p>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${isPending ? 'bg-yellow-200 text-yellow-800' : ans.is_correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                        {isPending ? '⏳ Pending' : ans.is_correct ? `✓ +${ans.score}pts` : '✗ 0pts'}
                                    </span>
                                </div>
                                {!isPending && !ans.is_correct && q.explanation && (
                                    <p className="text-xs text-red-700 mt-2 bg-red-100 px-3 py-2 rounded-lg"><LinkifyText text={q.explanation} /></p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Attempt history */}
                {history.length > 0 && (
                    <div className="border-t border-gray-100 px-6 py-4">
                        <button onClick={() => setShowHistory(h => !h)} className="text-xs font-bold text-gray-400 hover:text-primary uppercase tracking-wider transition-colors">
                            {showHistory ? '▼' : '▶'} Attempt History ({history.length})
                        </button>
                        {showHistory && (
                            <div className="mt-3 space-y-2">
                                {history.map(h => (
                                    <div key={h.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-gray-600">Attempt #{h.attempt_number}</span>
                                        <span className="text-gray-500">{h.submitted_at ? new Date(h.submitted_at).toLocaleDateString() : '—'}</span>
                                        <span className={`font-bold ${h.passed ? 'text-green-600' : 'text-red-500'}`}>{h.score.toFixed(1)}%</span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${h.status === 'graded' ? (h.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700') : 'bg-yellow-50 text-yellow-700'}`}>{h.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="px-6 pb-6 flex justify-end">
                    <Button variant="outline" onClick={handleRetake}>Try Again</Button>
                </div>
            </div>
        );
    }

    // ── Question view ─────────────────────────────────────────────────────────────
    const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Progress bar */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">
                        <LinkifyText text={assessment.title || 'Assessment'} /> · Question {currentIndex + 1} of {questions.length}
                    </span>
                    <div className="flex items-center gap-3">
                        {isSaving && <span className="text-[10px] text-gray-400 animate-pulse">Saving…</span>}
                        {assessment.time_limit_minutes > 0 && <span className="text-xs text-gray-500">⏱ {assessment.time_limit_minutes} min limit</span>}
                        <span className="text-xs font-bold text-primary">{progress}%</span>
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Question */}
            <div className="p-6">
                <div className="flex items-start gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">{currentIndex + 1}</span>
                    <div>
                        <h4 className="text-base font-semibold text-gray-900">{currentQ.prompt}</h4>
                        {currentQ.points > 1 && <span className="text-[10px] text-gray-400">{currentQ.points} points</span>}
                    </div>
                </div>

                {/* Multiple choice */}
                {currentQ.type === 'multiple_choice' && currentQ.choices && (
                    <div className="space-y-2 ml-11">
                        {currentQ.choices.sort((a, b) => a.order - b.order).map(c => {
                            const selected = (answers[currentQ.id] as string[] | undefined)?.includes(c.id);
                            return (
                                <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5'}`}>
                                    <input type="radio" name={`q_${currentQ.id}`} className="w-4 h-4 text-primary border-gray-300"
                                        checked={!!selected} onChange={() => handleAnswer(currentQ.id, [c.id])} />
                                    <span className="text-sm text-gray-800">{c.text}</span>
                                </label>
                            );
                        })}
                    </div>
                )}

                {/* Multiple select */}
                {currentQ.type === 'multiple_select' && currentQ.choices && (
                    <div className="space-y-2 ml-11">
                        <p className="text-xs text-gray-400 mb-2">Select all that apply</p>
                        {currentQ.choices.sort((a, b) => a.order - b.order).map(c => {
                            const selected = (answers[currentQ.id] as string[] | undefined)?.includes(c.id);
                            return (
                                <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5'}`}>
                                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300"
                                        checked={!!selected} onChange={() => handleMultiSelectToggle(currentQ.id, c.id)} />
                                    <span className="text-sm text-gray-800">{c.text}</span>
                                </label>
                            );
                        })}
                    </div>
                )}

                {/* True/False */}
                {currentQ.type === 'true_false' && currentQ.choices && (
                    <div className="flex gap-3 ml-11">
                        {currentQ.choices.sort((a, b) => a.order - b.order).map(c => {
                            const selected = (answers[currentQ.id] as string[] | undefined)?.includes(c.id);
                            return (
                                <button key={c.id} type="button" onClick={() => handleAnswer(currentQ.id, [c.id])}
                                    className={`flex-1 py-3 rounded-xl border font-semibold transition-colors text-sm ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>
                                    {c.text}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Fill blank */}
                {currentQ.type === 'fill_blank' && (
                    <div className="ml-11">
                        <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Type your answer…" value={(answers[currentQ.id] as string) ?? ''}
                            onChange={e => handleAnswer(currentQ.id, e.target.value)} />
                    </div>
                )}

                {/* Short answer */}
                {currentQ.type === 'short_answer' && (
                    <div className="ml-11">
                        <textarea className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-y"
                            placeholder="Write your answer here…" value={(answers[currentQ.id] as string) ?? ''}
                            onChange={e => handleAnswer(currentQ.id, e.target.value)} />
                        <p className="text-[10px] text-yellow-600 mt-1">⚠ This will be graded manually by an instructor.</p>
                    </div>
                )}

                {/* Essay */}
                {currentQ.type === 'essay' && (
                    <div className="ml-11">
                        <textarea className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[200px] resize-y"
                            placeholder="Write your essay here…" value={(answers[currentQ.id] as string) ?? ''}
                            onChange={e => handleAnswer(currentQ.id, e.target.value)} />
                        <p className="text-[10px] text-yellow-600 mt-1">⚠ This will be graded manually by an instructor.</p>
                    </div>
                )}

                {/* Matching */}
                {currentQ.type === 'matching' && currentQ.matching_pairs && (
                    <div className="ml-11 space-y-3">
                        <p className="text-xs text-gray-400">Match each term to its definition</p>
                        {currentQ.matching_pairs.map((pair, i) => {
                            const rightOptions = currentQ.matching_pairs!.map(p => p.right_text);
                            return (
                                <div key={pair.id} className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700">{pair.left_text}</div>
                                    <span className="text-gray-400">→</span>
                                    <select className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        value={(answers[currentQ.id] as Record<string, string>)?.[pair.left_text] || ''}
                                        onChange={e => handleMatchingPair(currentQ.id, pair.left_text, e.target.value)}>
                                        <option value="">Select match…</option>
                                        {rightOptions.map((opt, j) => <option key={j} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Ordering */}
                {currentQ.type === 'ordering' && currentQ.ordering_items && (
                    <div className="ml-11 space-y-2">
                        <p className="text-xs text-gray-400">Arrange the items in the correct order by selecting their position</p>
                        {currentQ.ordering_items.slice().sort((a, b) => {
                            const ordArr = answers[currentQ.id] as string[] | undefined;
                            if (!ordArr) return 0;
                            return ordArr.indexOf(a.id) - ordArr.indexOf(b.id);
                        }).map((item, i) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                <span className="text-sm text-gray-800 flex-1">{item.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation */}
            {submitError && <div className="px-6 pb-2 text-sm text-red-600">{submitError}</div>}
            <div className="px-6 pb-6 flex justify-between items-center gap-3">
                <Button variant="outline" onClick={() => navigate(currentIndex - 1)} disabled={currentIndex === 0}>← Previous</Button>
                <div className="flex gap-1">
                    {questions.map((_, i) => (
                        <button key={i} onClick={() => navigate(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-primary scale-125' : answers[questions[i].id] !== undefined ? 'bg-primary/40' : 'bg-gray-300'}`} />
                    ))}
                </div>
                {currentIndex < questions.length - 1 ? (
                    <Button variant="primary" onClick={() => navigate(currentIndex + 1)}>Next →</Button>
                ) : (
                    <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting…' : 'Submit Answers'}
                    </Button>
                )}
            </div>
        </div>
    );
}
