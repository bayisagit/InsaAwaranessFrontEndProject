'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentAnswer,
  getAssessment, getAssessments,
  startAssessment, resumeAssessment, saveAssessmentProgress, submitAssessment, getAssessmentAttempts, apiFetch,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { AssessmentSkeleton } from '@/components/LoadingSkeleton';
import { LinkifyText } from '@/components/LinkifyText';
import Link from 'next/link';
import { GripVertical, ChevronUp, ChevronDown, Link2, X, RotateCcw, Check } from 'lucide-react';

// ─── Props ──────────────────────────────────────────────────────────────────────
// Accepts either a direct assessmentId or a lessonId / certificateExamId to look up
interface AssessmentViewerProps {
 assessmentId?: string;
 lessonId?: string;
 certificateExamId?: string;
 onComplete?: () => void;
 previewMode?: boolean;
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

// ── Ordering Question Component (International Assessment Drag-and-Drop & Up/Down) ─
interface OrderingQuestionInputProps {
  question: AssessmentQuestion;
  value?: string[];
  onChange: (orderIds: string[]) => void;
}

function OrderingQuestionInput({ question, value, onChange }: OrderingQuestionInputProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const items = useMemo(() => question.ordering_items || [], [question.ordering_items]);

  // Compute current order of items based on value or default items list
  const orderedItems = useMemo(() => {
    if (Array.isArray(value) && value.length > 0) {
      const mapped = value
        .map(id => items.find(i => String(i.id) === String(id)))
        .filter(Boolean) as typeof items;
      for (const item of items) {
        if (!mapped.some(m => String(m.id) === String(item.id))) {
          mapped.push(item);
        }
      }
      return mapped;
    }
    return items;
  }, [value, items]);

  // Initialize order if not yet set
  useEffect(() => {
    if (!value || value.length === 0) {
      if (items.length > 0) {
        onChange(items.map(i => String(i.id)));
      }
    }
  }, [value, items, onChange]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;
    const next = [...orderedItems];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next.map(i => String(i.id)));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...orderedItems];
    const [moved] = next.splice(draggedIdx, 1);
    next.splice(targetIndex, 0, moved);
    setDraggedIdx(null);
    setDragOverIdx(null);
    onChange(next.map(i => String(i.id)));
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleReset = () => {
    onChange(items.map(i => String(i.id)));
  };

  return (
    <div className="space-y-3 ml-0 sm:ml-11">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pb-1">
        <span>Drag and drop items or use the up/down arrow buttons to arrange them in the correct sequence.</span>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Order
        </button>
      </div>

      <div className="space-y-2.5">
        {orderedItems.map((item, index) => {
          const isDragging = draggedIdx === index;
          const isDragOver = dragOverIdx === index && draggedIdx !== index;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-3.5 p-3.5 rounded-xl border transition-all select-none ${
                isDragging
                  ? 'opacity-40 border-dashed border-primary bg-primary/5 scale-[0.99]'
                  : isDragOver
                  ? 'border-primary ring-2 ring-primary/30 bg-primary/5 -translate-y-0.5'
                  : 'bg-card border-border hover:border-primary/40 hover:shadow-xs'
              }`}
            >
              {/* Drag Handle */}
              <div
                className="cursor-grab active:cursor-grabbing text-muted-foreground/60 group-hover:text-foreground p-1 -ml-1 transition-colors"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Order Number Badge */}
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                {index + 1}
              </div>

              {/* Item Text */}
              <span className="text-sm font-medium text-foreground flex-1 leading-snug">
                {item.text}
              </span>

              {/* Up/Down Controls */}
              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  aria-label={`Move "${item.text}" up`}
                  title="Move up"
                  className="p-1.5 rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === orderedItems.length - 1}
                  aria-label={`Move "${item.text}" down`}
                  title="Move down"
                  className="p-1.5 rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Matching Question Component (Standard Column A vs Column B Format) ───────────
interface MatchingQuestionInputProps {
  question: AssessmentQuestion;
  value?: Record<string, string>;
  onChange: (pairs: Record<string, string>) => void;
}

function MatchingQuestionInput({ question, value = {}, onChange }: MatchingQuestionInputProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [dragOverLeft, setDragOverLeft] = useState<string | null>(null);

  const pairs = useMemo(() => question.matching_pairs || [], [question.matching_pairs]);
  const currentPairs: Record<string, string> = value || {};

  // Deterministic stable shuffle of Column B options based on question ID
  const columnBOptions = useMemo(() => {
    if (!pairs.length) return [];
    const list = pairs.map(p => p.right_text);
    let seed = 0;
    for (let i = 0; i < question.id.length; i++) {
      seed = (seed * 31 + question.id.charCodeAt(i)) & 0xffffffff;
    }
    return [...list].sort((a, b) => {
      const ha = Math.sin(seed + a.length * 13) * 10000;
      const hb = Math.sin(seed + b.length * 13) * 10000;
      return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
    });
  }, [pairs, question.id]);

  const matchedCount = Object.keys(currentPairs).filter(k => !!currentPairs[k]).length;
  const totalCount = pairs.length;

  const linkPair = (leftText: string, rightText: string) => {
    const next = { ...currentPairs };
    // Remove existing assignment of this right option if already paired elsewhere (1-to-1 standard)
    for (const key of Object.keys(next)) {
      if (next[key] === rightText) {
        delete next[key];
      }
    }
    next[leftText] = rightText;
    onChange(next);
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const unlinkPair = (leftText: string) => {
    const next = { ...currentPairs };
    delete next[leftText];
    onChange(next);
    if (selectedLeft === leftText) setSelectedLeft(null);
  };

  const clearAll = () => {
    onChange({});
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const handleLeftClick = (leftText: string) => {
    if (selectedRight) {
      linkPair(leftText, selectedRight);
    } else if (selectedLeft === leftText) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftText);
    }
  };

  const handleRightClick = (rightText: string) => {
    if (selectedLeft) {
      linkPair(selectedLeft, rightText);
    } else if (selectedRight === rightText) {
      setSelectedRight(null);
    } else {
      setSelectedRight(rightText);
    }
  };

  const handleDragStartRight = (e: React.DragEvent, rightText: string) => {
    e.dataTransfer.setData('text/plain', rightText);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOverLeft = (e: React.DragEvent, leftText: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLeft !== leftText) setDragOverLeft(leftText);
  };

  const handleDropOnLeft = (e: React.DragEvent, leftText: string) => {
    e.preventDefault();
    const rightText = e.dataTransfer.getData('text/plain');
    if (rightText) {
      linkPair(leftText, rightText);
    }
    setDragOverLeft(null);
  };

  return (
    <div className="space-y-4 ml-0 sm:ml-11">
      {/* Header and counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/50 text-xs">
        <div>
          <p className="text-xs font-semibold text-foreground">Match each item in Column A with its corresponding match in Column B</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Click an item in Column A, then click its match in Column B (or drag and drop).</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            matchedCount === totalCount && totalCount > 0
              ? 'bg-green-500/10 text-green-600 border-green-500/20'
              : 'bg-muted text-muted-foreground border-border'
          }`}>
            {matchedCount === totalCount && totalCount > 0 ? '✓ All Matched' : `${matchedCount} / ${totalCount} matched`}
          </span>
          {matchedCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Clear Matches
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Column A */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            <span>Column A (Premises)</span>
            {selectedLeft && <span className="text-[11px] text-primary lowercase font-normal animate-pulse">select match in Column B…</span>}
          </div>

          <div className="space-y-2.5">
            {pairs.map((pair, idx) => {
              const matchedChoice = currentPairs[pair.left_text];
              const isSelected = selectedLeft === pair.left_text;
              const isDragOver = dragOverLeft === pair.left_text;

              return (
                <div
                  key={pair.id || idx}
                  onDragOver={e => handleDragOverLeft(e, pair.left_text)}
                  onDragLeave={() => setDragOverLeft(null)}
                  onDrop={e => handleDropOnLeft(e, pair.left_text)}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-xs'
                      : isDragOver
                      ? 'border-primary border-dashed bg-primary/10 ring-2 ring-primary/20 scale-[1.01]'
                      : matchedChoice
                      ? 'border-primary/30 bg-card'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{pair.left_text}</span>
                    </div>

                    {!matchedChoice && (
                      <button
                        type="button"
                        onClick={() => handleLeftClick(pair.left_text)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                        }`}
                      >
                        {isSelected ? 'Selecting…' : 'Select'}
                      </button>
                    )}
                  </div>

                  {/* Matched chip or empty drop slot */}
                  {matchedChoice ? (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">{matchedChoice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          unlinkPair(pair.left_text);
                        }}
                        aria-label={`Unlink match for ${pair.left_text}`}
                        title="Remove match"
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLeftClick(pair.left_text)}
                      className={`w-full text-left p-2.5 rounded-lg border border-dashed text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-medium animate-pulse'
                          : 'border-border/80 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/40'
                      }`}
                    >
                      {isSelected ? '👉 Click match in Column B' : '+ Click or drop match here'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column B */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            <span>Column B (Definitions / Options)</span>
            {selectedRight && <span className="text-[11px] text-primary lowercase font-normal animate-pulse">select premise in Column A…</span>}
          </div>

          <div className="space-y-2.5">
            {columnBOptions.map((optText, idx) => {
              const matchedLeftKey = Object.keys(currentPairs).find(k => currentPairs[k] === optText);
              const isSelected = selectedRight === optText;

              return (
                <div
                  key={idx}
                  draggable
                  onDragStart={e => handleDragStartRight(e, optText)}
                  onClick={() => handleRightClick(optText)}
                  className={`group p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-xs'
                      : matchedLeftKey
                      ? 'border-border/60 bg-muted/40 opacity-80 hover:opacity-100'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-foreground mt-0.5">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-foreground leading-snug">{optText}</span>
                    </div>

                    {matchedLeftKey ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 border border-primary/20">
                        <Check className="w-3 h-3" />
                        Matched
                      </span>
                    ) : (
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground opacity-0 group-hover:opacity-100 bg-muted'
                      }`}>
                        {isSelected ? 'Selected' : 'Match'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssessmentViewer({ assessmentId: propAssessmentId, lessonId, certificateExamId, onComplete, previewMode }: AssessmentViewerProps) {
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
  const [showAnswers, setShowAnswers] = useState(false);

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

  if (previewMode) {
      setAttempt(null);
      setResult(null);
      setHistory([]);
      setAnswers({});
      setCurrentIndex(0);
      setIsLoading(false);
      return;
  }

  // 2. Load history first to check for completed attempts
  const { data: hist } = await getAssessmentAttempts(id);
  const attempts = Array.isArray(hist) ? hist : [];
  setHistory(attempts);

  const lastGraded = attempts.find(h => h.status === 'graded' || h.status === 'needs_review');

  if (lastGraded) {
  // Show saved result instead of starting a new attempt
  setResult(lastGraded);
  if (!lastGraded.answers?.length) {
  // Fetch the full attempt detail with answers if not included
  const { data: fullAttempt } = await apiFetch(`/api/v1/assessments/${id}/attempts/`);
  if (fullAttempt) {
  const arr = Array.isArray(fullAttempt) ? fullAttempt : [];
  const found = arr.find((h: any) => h.id === lastGraded.id);
  if (found) { setResult(found); setAttempt(found); }
  }
  }
  setIsLoading(false);
  return;
  }

  // 3. Resume or Start
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

  setIsLoading(false);
  }, [propAssessmentId, lessonId, certificateExamId]);

 useEffect(() => { loadAssessment(); }, [loadAssessment]);

 // ── Auto-save on answer change ────────────────────────────────────────────────
 const scheduleSave = useCallback((qId: string, answer: any, index: number) => {
 if (previewMode) return;
 if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
 saveTimerRef.current = setTimeout(async () => {
 const aId = assessmentIdRef.current;
 if (!aId) return;
 setIsSaving(true);
 const q = assessment?.questions.find(q => q.id === qId);
 if (q) await saveAssessmentProgress(aId, { question_id: qId, answer: formatAnswerForApi(q, answer), current_question_index: index });
 setIsSaving(false);
 }, 800);
 }, [assessment, previewMode]);

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
 if (aId && !previewMode) await saveAssessmentProgress(aId, { current_question_index: nextIndex });
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
 let raw = answers[q.id];
 if (raw === undefined && q.type === 'ordering' && q.ordering_items?.length) {
 raw = q.ordering_items.map(item => String(item.id));
 }
 if (raw !== undefined) finalAnswers[q.id] = formatAnswerForApi(q, raw);
 }

 if (previewMode) {
     // Fake submission
     setTimeout(() => {
         setResult({
             id: 'fake-preview',
             assessment: aId,
             user: 'preview',
             attempt_number: 1,
             score: 100,
             passed: true,
             status: 'graded',
             started_at: new Date().toISOString(),
             submitted_at: new Date().toISOString(),
             answers: []
         } as any);
         setIsSubmitting(false);
         if (onComplete) onComplete();
     }, 1000);
     return;
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
 
 if (previewMode) {
     return;
 }
 
 setIsLoading(true);
 const { data, error: err } = await startAssessment(aId);
 if (err || !data) { setLoadError(err || 'Failed to start new attempt.'); setIsLoading(false); return; }
 setAttempt(data); setIsLoading(false);
 };

 // ── Render ────────────────────────────────────────────────────────────────────
 if (isLoading) return <AssessmentSkeleton />;

 if (loadError) return (
 <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">{loadError}</div>
 );

 if (!assessment || !assessment.questions?.length) return (
 <div className="p-8 bg-muted border-2 border-dashed border-border rounded-2xl text-center text-muted-foreground">
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
 <div className="bg-card border border-border rounded-2xl shadow-sm shadow-black/5 dark:shadow-none overflow-hidden">
 {/* Result header */}
 <div className={`px-6 py-8 text-center ${passed ? 'bg-green-50 dark:bg-green-950/30' : isPendingReview ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
 <div className="text-5xl mb-3">{passed ? '🏆' : isPendingReview ? '⏳' : '📚'}</div>
 {isPendingReview ? (
 <><h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-400 mb-1">Pending Review</h3>
 <p className="text-yellow-700 dark:text-yellow-400 text-sm">Your answers include questions that require manual grading. Results will be updated once reviewed by an instructor.</p></>
 ) : (
 <><h3 className={`text-xl font-bold mb-1 ${passed ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>{passed ? 'Well done! You passed!' : 'Keep practicing!'}</h3>
 <p className={`text-sm ${passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
 Score: <strong>{result.score.toFixed(1)}%</strong> (Pass mark: {assessment.passing_score}%)
 </p></>
 )}
 </div>

  {/* View Answers toggle */}
  <div className="border-t border-border px-6 pt-4">
  <button onClick={() => setShowAnswers(s => !s)} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider cursor-pointer">
  {showAnswers ? '▼' : '▶'} {showAnswers ? 'Hide Answers' : 'View Answers'}
  </button>
  </div>

  {/* Per-answer breakdown */}
  {showAnswers && (
  <div className="p-6 space-y-4">
  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Answer Review</h4>
  {result.answers.map(ans => {
  const q = questions.find(q => q.id === ans.question);
  if (!q) return null;
  const isPending = ans.requires_manual_grading;
  return (
  <div key={ans.id} className={`p-4 rounded-xl border ${isPending ? 'border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-950/30' : ans.is_correct ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30' : 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30'}`}>
  <div className="flex justify-between items-start gap-3">
  <p className="text-sm font-semibold text-foreground flex-1"><LinkifyText text={q.prompt} /></p>
  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${isPending ? 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400' : ans.score > 0 ? 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-400' : 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-400'}`}>
  {isPending ? '⏳ Pending Review' : `${ans.score} / ${q.points} pts`}
  </span>
  </div>

  {['short_answer', 'essay'].includes(q.type) && ans.response_text && (
    <div className="mt-2.5 p-3 rounded-lg bg-card border border-border text-xs">
      <span className="text-muted-foreground font-semibold block mb-1">Your Submission:</span>
      <p className="text-foreground whitespace-pre-wrap">{ans.response_text}</p>
    </div>
  )}

  {q.type === 'ordering' && q.ordering_items && (
    <div className="mt-2.5 p-3 rounded-lg bg-card border border-border text-xs space-y-2">
      <span className="text-muted-foreground font-semibold block">Your Submitted Sequence:</span>
      <div className="space-y-1.5">
        {(() => {
          const submittedOrder = ans.response_json?.order as string[] | undefined;
          const itemsToDisplay = submittedOrder && submittedOrder.length > 0
            ? submittedOrder.map(id => q.ordering_items.find(item => String(item.id) === String(id))).filter(Boolean) as typeof q.ordering_items
            : q.ordering_items;
          return itemsToDisplay.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 py-1 px-2.5 rounded bg-muted/60 text-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 border border-primary/20">{idx + 1}</span>
              <span className="flex-1 font-medium">{item.text}</span>
            </div>
          ));
        })()}
      </div>
    </div>
  )}

  {q.type === 'matching' && q.matching_pairs && (
    <div className="mt-2.5 p-3 rounded-lg bg-card border border-border text-xs space-y-2">
      <span className="text-muted-foreground font-semibold block">Your Matched Pairs:</span>
      <div className="space-y-1.5">
        {(() => {
          const submittedPairs = (ans.response_json?.pairs || {}) as Record<string, string>;
          return q.matching_pairs.map(p => {
            const userMatch = submittedPairs[p.left_text];
            const isMatchCorrect = userMatch === p.right_text;
            return (
              <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-1.5 px-2.5 rounded bg-muted/60 text-foreground">
                <span className="font-semibold text-foreground">{p.left_text}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground hidden sm:inline">→</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${userMatch ? (isMatchCorrect ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300') : 'text-muted-foreground italic'}`}>
                    {userMatch || '(No match selected)'}
                  </span>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  )}

  {ans.feedback && (
    <div className="mt-2.5 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground">
      <span className="font-semibold text-primary flex items-center gap-1 mb-1">
        <span>💬</span> Instructor Feedback:
      </span>
      <p className="whitespace-pre-wrap">{ans.feedback}</p>
    </div>
  )}

  {!isPending && !ans.is_correct && q.explanation && (
  <p className="text-xs text-red-700 mt-2 bg-red-100 px-3 py-2 rounded-xl dark:text-red-300 dark:bg-red-900/30"><LinkifyText text={q.explanation} /></p>
  )}
  </div>
  );
  })}
  </div>
  )}

 {/* Attempt history */}
 {history.length > 0 && (
 <div className="border-t border-border px-6 py-4">
 <button onClick={() => setShowHistory(h => !h)} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors duration-200 uppercase tracking-wider transition-colors cursor-pointer">
 {showHistory ? '▼' : '▶'} Attempt History ({history.length})
 </button>
 {showHistory && (
 <div className="mt-3 space-y-2">
 {history.map(h => (
 <div key={h.id} className="flex items-center justify-between text-xs py-2 border-b border-border last:border-0">
 <span className="text-muted-foreground">Attempt #{h.attempt_number}</span>
 <span className="text-muted-foreground">{h.submitted_at ? new Date(h.submitted_at).toLocaleDateString() : '—'}</span>
 <span className={`font-bold ${h.passed ? 'text-green-600' : 'text-red-500'}`}>{h.score.toFixed(1)}%</span>
 <span className={`px-2 py-0.5 rounded-full font-bold ${h.status === 'graded' ? (h.passed ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400') : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>{h.status}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

  <div className="px-6 pb-6 flex justify-end gap-3">
  {!passed && <Button variant="outline" onClick={handleRetake}>Try Again</Button>}
  {passed && assessment?.parent_type === 'course_exam' && (
  <Link href={previewMode ? "#" : "/dashboard/certificates"}>
  <Button variant="primary">🎓 Get Certificate</Button>
  </Link>
  )}
  </div>
 </div>
 );
 }

 // ── Question view ─────────────────────────────────────────────────────────────
 const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

 return (
 <div className="bg-card border border-border rounded-2xl shadow-sm shadow-black/5 dark:shadow-none overflow-hidden">
 {/* Progress bar */}
 <div className="bg-muted px-6 py-4 border-b border-border">
 <div className="flex justify-between items-center mb-2">
 <span className="text-sm font-bold text-foreground">
 <LinkifyText text={assessment.title || 'Assessment'} /> · Question {currentIndex + 1} of {questions.length}
 </span>
 <div className="flex items-center gap-3">
 {isSaving && <span className="text-[10px] text-muted-foreground animate-pulse">Saving…</span>}
 {assessment.time_limit_minutes > 0 && <span className="text-xs text-muted-foreground">⏱ {assessment.time_limit_minutes} min limit</span>}
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
 <h4 className="text-base font-semibold text-foreground">{currentQ.prompt}</h4>
 {currentQ.points > 1 && <span className="text-[10px] text-muted-foreground">{currentQ.points} points</span>}
 </div>
 </div>

 {/* Multiple choice */}
 {currentQ.type === 'multiple_choice' && currentQ.choices && (
 <div className="space-y-2 ml-11">
 {currentQ.choices.sort((a, b) => a.order - b.order).map(c => {
 const selected = (answers[currentQ.id] as string[] | undefined)?.includes(c.id);
 return (
 <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30 hover:bg-primary/5'}`}>
 <input type="radio" name={`q_${currentQ.id}`} className="w-4 h-4 text-primary border-border"
 checked={!!selected} onChange={() => handleAnswer(currentQ.id, [c.id])} />
 <span className="text-sm text-foreground">{c.text}</span>
 </label>
 );
 })}
 </div>
 )}

 {/* Multiple select */}
 {currentQ.type === 'multiple_select' && currentQ.choices && (
 <div className="space-y-2 ml-11">
 <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
 {currentQ.choices.sort((a, b) => a.order - b.order).map(c => {
 const selected = (answers[currentQ.id] as string[] | undefined)?.includes(c.id);
 return (
 <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30 hover:bg-primary/5'}`}>
 <input type="checkbox" className="w-4 h-4 text-primary rounded border-border"
 checked={!!selected} onChange={() => handleMultiSelectToggle(currentQ.id, c.id)} />
 <span className="text-sm text-foreground">{c.text}</span>
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
 className={`flex-1 py-3 rounded-xl border font-semibold transition-colors text-sm ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
 {c.text}
 </button>
 );
 })}
 </div>
 )}

 {/* Fill blank */}
 {currentQ.type === 'fill_blank' && (
 <div className="ml-11 cursor-pointer">
 <input type="text" className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
 placeholder="Type your answer…" value={(answers[currentQ.id] as string) ?? ''}
 onChange={e => handleAnswer(currentQ.id, e.target.value)} />
 </div>
 )}

 {/* Short answer */}
 {currentQ.type === 'short_answer' && (
 <div className="ml-11">
 <textarea className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-y"
 placeholder="Write your answer here…" value={(answers[currentQ.id] as string) ?? ''}
 onChange={e => handleAnswer(currentQ.id, e.target.value)} />
 <p className="text-[10px] text-yellow-600 mt-1">⚠ This will be graded manually by an instructor.</p>
 </div>
 )}

 {/* Essay */}
 {currentQ.type === 'essay' && (
 <div className="ml-11">
 <textarea className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[200px] resize-y"
 placeholder="Write your essay here…" value={(answers[currentQ.id] as string) ?? ''}
 onChange={e => handleAnswer(currentQ.id, e.target.value)} />
 <p className="text-[10px] text-yellow-600 mt-1">⚠ This will be graded manually by an instructor.</p>
 </div>
 )}

 {/* Matching */}
 {currentQ.type === 'matching' && currentQ.matching_pairs && (
   <MatchingQuestionInput
     question={currentQ}
     value={(answers[currentQ.id] as Record<string, string>) || {}}
     onChange={pairs => handleAnswer(currentQ.id, pairs)}
   />
 )}

 {/* Ordering */}
 {currentQ.type === 'ordering' && currentQ.ordering_items && (
   <OrderingQuestionInput
     question={currentQ}
     value={answers[currentQ.id] as string[] | undefined}
     onChange={newOrderIds => handleAnswer(currentQ.id, newOrderIds)}
   />
 )}
 </div>

 {/* Navigation */}
 {submitError && <div className="px-6 pb-2 text-sm text-red-600">{submitError}</div>}
 <div className="px-6 pb-6 flex justify-between items-center gap-3">
 <Button variant="outline" onClick={() => navigate(currentIndex - 1)} disabled={currentIndex === 0}>← Previous</Button>
 <div className="flex gap-1">
 {questions.map((qItem, i) => {
   const raw = answers[qItem.id];
   const isAnswered = raw !== undefined && raw !== null && (
     Array.isArray(raw) ? raw.length > 0 :
     typeof raw === 'object' ? Object.keys(raw).length > 0 :
     typeof raw === 'string' ? raw.trim().length > 0 :
     Boolean(raw)
   );
   return (
     <button key={i} onClick={() => navigate(i)}
       className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-primary scale-125' : isAnswered ? 'bg-primary/40' : 'bg-gray-300'}`} />
   );
 })}
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
