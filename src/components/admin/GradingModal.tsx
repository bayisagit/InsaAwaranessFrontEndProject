'use client';

import React, { useState, useEffect } from 'react';
import {
    AssessmentAttempt,
    ManualGradeItem,
    gradeAssessmentAttempt,
    getAssessmentAttemptDetail
} from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { LinkifyText } from '@/components/LinkifyText';
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    User,
    BookOpen,
    GraduationCap,
    Sparkles,
    Check,
    HelpCircle,
    MessageSquare
} from 'lucide-react';

interface GradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    attemptId: string | null;
    onGradedSuccessfully?: (updatedAttempt: AssessmentAttempt) => void;
}

export function GradingModal({
    isOpen,
    onClose,
    attemptId,
    onGradedSuccessfully
}: GradingModalProps) {
    const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // State for manual question scores & feedbacks: key is answer.id
    const [manualGrades, setManualGrades] = useState<Record<string, { score: number; feedback: string }>>({});

    useEffect(() => {
        if (isOpen && attemptId) {
            fetchAttemptDetails(attemptId);
        } else {
            setAttempt(null);
            setManualGrades({});
            setError(null);
            setSuccessMessage(null);
        }
    }, [isOpen, attemptId]);

    const fetchAttemptDetails = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await getAssessmentAttemptDetail(id);
            if (err || !data) {
                setError(err || 'Failed to fetch assessment attempt details.');
                setLoading(false);
                return;
            }
            setAttempt(data);

            // Prepopulate manual scores and feedbacks
            const initialGrades: Record<string, { score: number; feedback: string }> = {};
            (data.answers || []).forEach(ans => {
                const qType = ans.question_details?.type;
                const isManual = ans.requires_manual_grading || qType === 'short_answer' || qType === 'essay';
                if (isManual) {
                    initialGrades[ans.id] = {
                        score: typeof ans.score === 'number' ? ans.score : 0,
                        feedback: ans.feedback || ''
                    };
                }
            });
            setManualGrades(initialGrades);
        } catch (e: any) {
            setError(e?.message || 'Error loading attempt.');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (answerId: string, maxPoints: number, value: string) => {
        let numVal = parseFloat(value);
        if (isNaN(numVal)) numVal = 0;
        if (numVal < 0) numVal = 0;
        if (numVal > maxPoints) numVal = maxPoints;

        setManualGrades(prev => ({
            ...prev,
            [answerId]: {
                ...prev[answerId],
                score: numVal
            }
        }));
    };

    const handleQuickScore = (answerId: string, points: number) => {
        setManualGrades(prev => ({
            ...prev,
            [answerId]: {
                ...prev[answerId],
                score: Math.round(points * 10) / 10
            }
        }));
    };

    const handleFeedbackChange = (answerId: string, feedback: string) => {
        setManualGrades(prev => ({
            ...prev,
            [answerId]: {
                ...prev[answerId],
                feedback
            }
        }));
    };

    // Calculate live totals
    const calculateTotals = () => {
        if (!attempt) return { totalScore: 0, maxPoints: 0, percentage: 0, willPass: false, autoGradedPoints: 0, manualPoints: 0, passingScore: 70 };

        let autoGradedPoints = 0;
        let manualPoints = 0;
        let totalMaxPoints = 0;

        (attempt.answers || []).forEach(ans => {
            const qPoints = ans.question_details?.points ?? 1;
            totalMaxPoints += qPoints;

            const qType = ans.question_details?.type;
            const isManual = ans.requires_manual_grading || qType === 'short_answer' || qType === 'essay';

            if (isManual) {
                const manual = manualGrades[ans.id];
                manualPoints += manual ? (manual.score || 0) : (ans.score || 0);
            } else {
                autoGradedPoints += (ans.score || 0);
            }
        });

        const totalScore = autoGradedPoints + manualPoints;
        const percentage = totalMaxPoints > 0 ? (totalScore / totalMaxPoints) * 100 : 0;
        const passingScore = attempt.passing_score ?? 70;
        const willPass = percentage >= passingScore;

        return {
            autoGradedPoints,
            manualPoints,
            totalScore,
            maxPoints: totalMaxPoints,
            percentage,
            passingScore,
            willPass
        };
    };

    const handleSubmitGrade = async () => {
        if (!attempt) return;
        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        const gradesPayload: ManualGradeItem[] = Object.entries(manualGrades).map(([answer_id, data]) => ({
            answer_id,
            score: data.score,
            feedback: data.feedback?.trim() || ''
        }));

        try {
            const { data, error: err } = await gradeAssessmentAttempt(attempt.id, {
                grades: gradesPayload
            });

            if (err || !data) {
                setError(err || 'Failed to submit grades. Please try again.');
                setSubmitting(false);
                return;
            }

            setSuccessMessage('Grades and feedback saved successfully!');
            setAttempt(data);
            if (onGradedSuccessfully) {
                onGradedSuccessfully(data);
            }
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (e: any) {
            setError(e?.message || 'Unexpected error occurred while grading.');
        } finally {
            setSubmitting(false);
        }
    };

    const totals = calculateTotals();
    const manualAnswers = (attempt?.answers || []).filter(ans => {
        const qType = ans.question_details?.type;
        return ans.requires_manual_grading || qType === 'short_answer' || qType === 'essay';
    });
    const autoAnswers = (attempt?.answers || []).filter(ans => {
        const qType = ans.question_details?.type;
        return !(ans.requires_manual_grading || qType === 'short_answer' || qType === 'essay');
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Review & Grade Assessment Attempt"
            maxWidth="4xl"
        >
            <div className="space-y-6">
                {loading && (
                    <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-medium">Loading student attempt details...</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Error</p>
                            <p className="text-xs mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}

                {!loading && attempt && (
                    <>
                        {/* Header Profile & Summary */}
                        <div className="p-4.5 rounded-2xl bg-muted/40 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                                    {attempt.user_details?.profile_photo ? (
                                        <img
                                            src={attempt.user_details.profile_photo}
                                            alt=""
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-6 h-6" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-base text-foreground">
                                            {attempt.user_details
                                                ? `${attempt.user_details.first_name} ${attempt.user_details.last_name}`
                                                : 'Student'}
                                        </h3>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-mono">
                                            Attempt #{attempt.attempt_number}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {attempt.user_details?.email}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                                        {attempt.course_title && (
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                                {attempt.course_title}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                            {attempt.assessment_title || 'Assessment'}
                                        </span>
                                        {attempt.submitted_at && (
                                            <span className="flex items-center gap-1 text-[11px]">
                                                <Clock className="w-3 h-3" />
                                                Submitted: {new Date(attempt.submitted_at).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status badge */}
                            <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                                        attempt.status === 'graded'
                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                            : attempt.status === 'needs_review'
                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                    }`}
                                >
                                    {attempt.status === 'graded' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    {attempt.status === 'needs_review' && <Clock className="w-3.5 h-3.5" />}
                                    {attempt.status.replace('_', ' ')}
                                </span>
                                {attempt.graded_at && (
                                    <span className="text-[11px] text-muted-foreground">
                                        Graded: {new Date(attempt.graded_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Live Score Calculator Bar */}
                        <div className="p-4.5 rounded-2xl bg-card border-2 border-primary/20 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Live Calculated Grade
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-3xl font-extrabold text-foreground">
                                            {totals.percentage.toFixed(1)}%
                                        </span>
                                        <span className="text-sm text-muted-foreground font-medium">
                                            ({totals.totalScore.toFixed(1)} / {totals.maxPoints} points)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground font-medium">
                                            Pass Threshold: {totals.passingScore}%
                                        </div>
                                        <div className="mt-1 flex items-center gap-1.5 justify-end">
                                            {totals.willPass ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                                                    <Check className="w-3.5 h-3.5" /> Passing
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                                                    <XCircle className="w-3.5 h-3.5" /> Below Passing
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown pill tags */}
                            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                                <span className="bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
                                    Auto-graded points: <strong className="text-foreground">{totals.autoGradedPoints.toFixed(1)} pts</strong>
                                </span>
                                <span className="bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
                                    Manual points: <strong className="text-primary">{totals.manualPoints.toFixed(1)} pts</strong>
                                </span>
                                <span className="bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
                                    Questions requiring review: <strong className="text-amber-600 dark:text-amber-400">{manualAnswers.length}</strong>
                                </span>
                            </div>
                        </div>

                        {/* Manual Grading Questions Section */}
                        {manualAnswers.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        Questions Requiring Manual Grading ({manualAnswers.length})
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                        Assign scores and feedback below
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {manualAnswers.map((ans, idx) => {
                                        const q = ans.question_details;
                                        const maxPts = q?.points ?? 1;
                                        const gradeData = manualGrades[ans.id] || { score: 0, feedback: '' };

                                        return (
                                            <div
                                                key={ans.id}
                                                className="p-5 rounded-2xl bg-card border-2 border-amber-500/30 dark:border-amber-500/20 shadow-sm space-y-4 transition-all"
                                            >
                                                {/* Question Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center border border-amber-500/20">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                                                {q?.type === 'essay' ? 'Essay Question' : 'Short Answer Question'}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                • Max Points: <strong>{maxPts}</strong>
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-semibold text-foreground mt-1">
                                                            <LinkifyText text={q?.prompt || 'Question prompt'} />
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Expected Answer / Reference Rubric (if defined when question was created) */}
                                                {(q?.correct_text_answer || q?.explanation) && (
                                                    <div className="space-y-2">
                                                        {q?.correct_text_answer && (
                                                            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/25 text-xs">
                                                                <span className="font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5 mb-1">
                                                                    <Check className="w-3.5 h-3.5" /> Expected / Correct Answer:
                                                                </span>
                                                                <p className="text-foreground whitespace-pre-wrap font-mono text-xs leading-relaxed bg-card/60 p-2.5 rounded-lg border border-green-500/20 select-text">
                                                                    {q.correct_text_answer}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {q?.explanation && (
                                                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                                                                <span className="font-bold text-primary flex items-center gap-1 mb-1">
                                                                    <HelpCircle className="w-3.5 h-3.5" /> Grading Rubric / Notes:
                                                                </span>
                                                                <p className="text-foreground whitespace-pre-wrap leading-relaxed"><LinkifyText text={q.explanation} /></p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Student's Response */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-foreground flex items-center gap-1.5">
                                                            <User className="w-3.5 h-3.5 text-primary" /> Learner Submitted Response:
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground font-mono">
                                                            {(ans.response_text || '').trim().split(/\s+/).filter(Boolean).length} words • {(ans.response_text || '').length} characters
                                                        </span>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-muted/40 border border-border font-sans text-sm text-foreground whitespace-pre-wrap leading-relaxed select-text min-h-[70px]">
                                                        {ans.response_text ? (
                                                            ans.response_text
                                                        ) : (
                                                            <span className="text-muted-foreground italic">No answer provided by the learner.</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Scoring Controls & Buttons */}
                                                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <label className="text-xs font-bold text-foreground">
                                                            Score for this response:
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            {/* Quick action buttons */}
                                                            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuickScore(ans.id, 0)}
                                                                    className={`px-2 py-1 text-xs font-semibold rounded ${
                                                                        gradeData.score === 0
                                                                            ? 'bg-red-500 text-white shadow-xs'
                                                                            : 'text-muted-foreground hover:text-foreground'
                                                                    }`}
                                                                >
                                                                    0 pts (0%)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuickScore(ans.id, maxPts / 2)}
                                                                    className={`px-2 py-1 text-xs font-semibold rounded ${
                                                                        gradeData.score === maxPts / 2
                                                                            ? 'bg-amber-500 text-white shadow-xs'
                                                                            : 'text-muted-foreground hover:text-foreground'
                                                                    }`}
                                                                >
                                                                    {maxPts / 2} pts (50%)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuickScore(ans.id, maxPts)}
                                                                    className={`px-2 py-1 text-xs font-semibold rounded ${
                                                                        gradeData.score === maxPts
                                                                            ? 'bg-green-600 text-white shadow-xs'
                                                                            : 'text-muted-foreground hover:text-foreground'
                                                                    }`}
                                                                >
                                                                    {maxPts} pts (100%)
                                                                </button>
                                                            </div>

                                                            {/* Numeric input */}
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <input
                                                                    type="number"
                                                                    step="0.5"
                                                                    min="0"
                                                                    max={maxPts}
                                                                    value={gradeData.score}
                                                                    onChange={(e) => handleScoreChange(ans.id, maxPts, e.target.value)}
                                                                    className="w-18 px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground font-bold text-sm text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                                                />
                                                                <span className="text-xs font-medium text-muted-foreground">
                                                                    / {maxPts} pts
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Feedback Textarea */}
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                                            <MessageSquare className="w-3.5 h-3.5" /> Instructor Feedback for Student:
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            placeholder="Add personalized feedback, constructive notes, or explanations for this question (optional)..."
                                                            value={gradeData.feedback}
                                                            onChange={(e) => handleFeedbackChange(ans.id, e.target.value)}
                                                            className="w-full text-xs p-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Auto-Graded Questions Summary */}
                        {autoAnswers.length > 0 && (
                            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    Auto-Graded Questions Summary ({autoAnswers.length})
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {autoAnswers.map((ans, i) => {
                                        const q = ans.question_details;
                                        const qPts = q?.points ?? 1;
                                        const isCorrect = ans.is_correct;

                                        return (
                                            <div
                                                key={ans.id}
                                                className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                                        isCorrect
                                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {isCorrect ? '✓' : '✗'}
                                                    </span>
                                                    <span className="text-foreground truncate">
                                                        {q?.prompt || `Question #${i + 1}`}
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase shrink-0">
                                                        {q?.type?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <span className={`font-bold shrink-0 ${
                                                    isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                    {ans.score} / {qPts} pts
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="primary"
                                    onClick={handleSubmitGrade}
                                    disabled={submitting}
                                    className="w-full sm:w-auto shadow-md"
                                >
                                    {submitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Submitting Grades...</span>
                                        </div>
                                    ) : (
                                        <span>Save & Finalize Grades</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
