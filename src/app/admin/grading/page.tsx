'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import {
    AssessmentAttempt,
    Course,
    Assessment,
    getAllAssessmentAttempts,
    getCourses,
    getAssessments
} from '@/lib/api';
import { GradingModal } from '@/components/admin/GradingModal';
import { Button } from '@/components/Button';
import {
    ClipboardCheck,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    XCircle,
    User,
    BookOpen,
    GraduationCap,
    RefreshCw,
    Sparkles,
    AlertCircle,
    ChevronRight,
    ArrowUpDown,
    Check,
    BarChart3,
    Eye
} from 'lucide-react';

export default function AdminGradingPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const searchParams = useSearchParams();

    // Query filters
    const initialAssessmentId = searchParams.get('assessmentId') || '';
    const initialCourseId = searchParams.get('courseId') || '';

    const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(initialAssessmentId);

    // Dropdown options
    const [courses, setCourses] = useState<Course[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loadingAssessments, setLoadingAssessments] = useState<boolean>(false);

    // Selected attempt for grading modal
    const [gradingAttemptId, setGradingAttemptId] = useState<string | null>(null);
    const [isGradingModalOpen, setIsGradingModalOpen] = useState<boolean>(false);

    // Fetch courses on mount
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchCourses = async () => {
            const coursesRes = await getCourses({ page_size: 100 });
            if (coursesRes.data?.results) {
                setCourses(coursesRes.data.results);
            }
        };
        fetchCourses();
    }, [isAuthenticated]);

    // Fetch assessments dynamically when selectedCourseId changes
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchFilteredAssessments = async () => {
            setLoadingAssessments(true);
            const params: Record<string, any> = { page_size: 100 };
            if (selectedCourseId) {
                params.course_scope = selectedCourseId;
            }
            const assessmentsRes = await getAssessments(params);
            if (assessmentsRes.data?.results) {
                const results = assessmentsRes.data.results;
                setAssessments(results);
                // Reset selected assessment if it doesn't belong to the newly filtered list
                if (selectedAssessmentId && !results.some(a => a.id === selectedAssessmentId)) {
                    setSelectedAssessmentId('');
                }
            } else {
                setAssessments([]);
            }
            setLoadingAssessments(false);
        };
        fetchFilteredAssessments();
    }, [isAuthenticated, selectedCourseId]);

    // Fetch attempts
    const fetchAttempts = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        setError(null);

        const params: Record<string, any> = {
            page_size: 100,
        };

        if (statusFilter && statusFilter !== 'all') {
            params.status = statusFilter;
        }
        if (selectedCourseId) {
            params.course = selectedCourseId;
        }
        if (selectedAssessmentId) {
            params.assessment = selectedAssessmentId;
        }
        if (searchQuery.trim()) {
            params.search = searchQuery.trim();
        }

        try {
            const { data, error: err } = await getAllAssessmentAttempts(params);
            if (err || !data) {
                setError(err || 'Failed to load assessment attempts.');
                setAttempts([]);
                setTotalCount(0);
            } else {
                setAttempts(data.results || []);
                setTotalCount(data.count || 0);
            }
        } catch (e: any) {
            setError(e?.message || 'Error occurred while loading submissions.');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, statusFilter, selectedCourseId, selectedAssessmentId, searchQuery]);

    useEffect(() => {
        fetchAttempts();
    }, [fetchAttempts]);

    // Calculate Dashboard KPIs
    const kpis = useMemo(() => {
        const total = attempts.length;
        const needsReview = attempts.filter(a => a.status === 'needs_review' || a.needs_manual_review).length;
        const graded = attempts.filter(a => a.status === 'graded').length;
        const passedCount = attempts.filter(a => a.passed).length;
        const passRate = total > 0 ? Math.round((passedCount / total) * 100) : 0;

        return {
            total,
            needsReview,
            graded,
            passRate
        };
    }, [attempts]);

    const handleOpenGrading = (attemptId: string) => {
        setGradingAttemptId(attemptId);
        setIsGradingModalOpen(true);
    };

    const handleGradingComplete = (updatedAttempt: AssessmentAttempt) => {
        setAttempts(prev =>
            prev.map(att => (att.id === updatedAttempt.id ? { ...att, ...updatedAttempt } : att))
        );
        fetchAttempts();
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Grading & Evaluation</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Assessment Submissions
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                        Review, manually score Short Answer and Essay questions, provide feedback, and finalize student attempts across your courses.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        onClick={fetchAttempts}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Submissions */}
                <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Total Submissions
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <BookOpen className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-foreground mt-2">
                        {totalCount || attempts.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Across managed assessments</p>
                </div>

                {/* Pending Review */}
                <div
                    onClick={() => setStatusFilter(statusFilter === 'needs_review' ? 'all' : 'needs_review')}
                    className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
                        statusFilter === 'needs_review'
                            ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
                            : 'bg-card border-border hover:border-amber-500/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Needs Review
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
                        {kpis.needsReview}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting instructor grading</p>
                </div>

                {/* Graded */}
                <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Graded
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-foreground mt-2">
                        {kpis.graded}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Completed evaluations</p>
                </div>

                {/* Pass Rate */}
                <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Pass Rate
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-foreground mt-2">
                        {kpis.passRate}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Overall completion rate</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by student name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>

                    {/* Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedCourseId}
                            onChange={(e) => {
                                setSelectedCourseId(e.target.value);
                                setSelectedAssessmentId('');
                            }}
                            className="text-xs px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="">All Courses</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.title}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedAssessmentId}
                            onChange={(e) => setSelectedAssessmentId(e.target.value)}
                            disabled={loadingAssessments}
                            className="text-xs px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
                        >
                            <option value="">
                                {loadingAssessments
                                    ? 'Loading assessments...'
                                    : selectedCourseId
                                    ? `All Assessments in Course (${assessments.length})`
                                    : `All Assessments (${assessments.length})`}
                            </option>
                            {assessments.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.title} {a.parent_type ? `(${a.parent_type.replace('_', ' ')})` : ''}
                                </option>
                            ))}
                        </select>

                        {(selectedCourseId || selectedAssessmentId || searchQuery || statusFilter !== 'all') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedCourseId('');
                                    setSelectedAssessmentId('');
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                }}
                                className="text-xs h-8"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border">
                    {[
                        { id: 'all', label: 'All Attempts' },
                        { id: 'needs_review', label: 'Needs Review', badge: kpis.needsReview },
                        { id: 'graded', label: 'Graded' },
                        { id: 'submitted', label: 'Submitted' },
                    ].map((tab) => {
                        const active = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                                    active
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {typeof tab.badge === 'number' && tab.badge > 0 && (
                                    <span
                                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                            active
                                                ? 'bg-white/20 text-white'
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        }`}
                                    >
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Submissions Table / List */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Unable to load submissions</p>
                        <p className="text-xs mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                {loading ? (
                    <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-medium">Loading assessment attempts...</p>
                    </div>
                ) : attempts.length === 0 ? (
                    <div className="py-16 px-6 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl text-muted-foreground/60">
                            📝
                        </div>
                        <h3 className="font-bold text-foreground text-base">No Submissions Found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            {statusFilter === 'needs_review'
                                ? 'All assessment submissions have been reviewed and graded! Excellent work.'
                                : 'No attempts match the selected filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-5 py-3.5">Student</th>
                                    <th className="px-5 py-3.5">Course & Assessment</th>
                                    <th className="px-5 py-3.5">Submitted</th>
                                    <th className="px-5 py-3.5 text-center">Questions</th>
                                    <th className="px-5 py-3.5 text-center">Score</th>
                                    <th className="px-5 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-medium">
                                {attempts.map((attempt) => {
                                    const needsManual = attempt.status === 'needs_review' || attempt.needs_manual_review;
                                    const manualCount = (attempt.answers || []).filter(
                                        a => a.requires_manual_grading || a.question_details?.type === 'short_answer' || a.question_details?.type === 'essay'
                                    ).length;

                                    return (
                                        <tr
                                            key={attempt.id}
                                            className="hover:bg-muted/30 transition-colors group"
                                        >
                                            {/* Student Column */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
                                                        {attempt.user_details?.profile_photo ? (
                                                            <img
                                                                src={attempt.user_details.profile_photo}
                                                                alt=""
                                                                className="w-full h-full rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                                            <span>
                                                                {attempt.user_details
                                                                    ? `${attempt.user_details.first_name} ${attempt.user_details.last_name}`
                                                                    : 'Student'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                            {attempt.user_details?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Course & Assessment Column */}
                                            <td className="px-5 py-4">
                                                <div className="space-y-0.5 max-w-[240px]">
                                                    <div className="font-semibold text-foreground text-sm truncate">
                                                        {attempt.assessment_title || 'Assessment'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                                        {attempt.course_title && (
                                                            <span className="truncate">{attempt.course_title}</span>
                                                        )}
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted border border-border uppercase font-mono shrink-0">
                                                            {attempt.assessment_parent_type?.replace('_', ' ') || 'Exam'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Submitted Date */}
                                            <td className="px-5 py-4 text-xs text-muted-foreground">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">
                                                        {attempt.submitted_at
                                                            ? new Date(attempt.submitted_at).toLocaleDateString()
                                                            : '—'}
                                                    </span>
                                                    <span className="text-[11px]">
                                                        {attempt.submitted_at
                                                            ? new Date(attempt.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : 'In Progress'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Questions Details */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {attempt.answers?.length || 0} answers
                                                    </span>
                                                    {manualCount > 0 && (
                                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                                                            {manualCount} manual
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Score */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-sm text-foreground">
                                                        {attempt.score.toFixed(1)}%
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        Pass: {attempt.passing_score ?? 70}%
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                        attempt.status === 'graded'
                                                            ? attempt.passed
                                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                                            : needsManual
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                                                            : 'bg-muted text-muted-foreground border border-border'
                                                    }`}
                                                >
                                                    {attempt.status === 'graded' ? (
                                                        attempt.passed ? (
                                                            <Check className="w-3 h-3" />
                                                        ) : (
                                                            <XCircle className="w-3 h-3" />
                                                        )
                                                    ) : (
                                                        <Clock className="w-3 h-3" />
                                                    )}
                                                    <span>{attempt.status.replace('_', ' ')}</span>
                                                </span>
                                            </td>

                                            {/* Actions Button */}
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <Button
                                                    variant={needsManual ? 'primary' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handleOpenGrading(attempt.id)}
                                                    className={`text-xs whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-xl font-semibold shadow-xs transition-all ${
                                                        needsManual
                                                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
                                                            : 'hover:bg-primary/10 hover:text-primary hover:border-primary/30'
                                                    }`}
                                                >
                                                    {needsManual ? (
                                                        <>
                                                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                                            <span>Review & Grade</span>
                                                        </>
                                                    ) : attempt.status === 'graded' ? (
                                                        <>
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                            <span>Review Grade</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                            <span>View Attempt</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Interactive Grading Modal */}
            <GradingModal
                isOpen={isGradingModalOpen}
                onClose={() => setIsGradingModalOpen(false)}
                attemptId={gradingAttemptId}
                onGradedSuccessfully={handleGradingComplete}
            />
        </div>
    );
}
