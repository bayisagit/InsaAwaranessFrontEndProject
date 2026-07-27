'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAssessment, Assessment } from '@/lib/api';
import { AssessmentViewer } from '@/components/AssessmentViewer';

export default function CourseExamPage() {
    const { id: courseId, examId } = useParams<{ id: string; examId: string }>();
    const router = useRouter();
    const [exam, setExam] = useState<Assessment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (examId) fetchExam();
    }, [examId]);

    const fetchExam = async () => {
        setIsLoading(true);
        const { data, error: err } = await getAssessment(examId);
        if (err) setError(err);
        else if (data) setExam(data);
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !exam) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center p-6 text-center">
                <div>
                    <p className="text-red-600 font-bold mb-4">{error || 'Exam not found.'}</p>
                    <Link href={`/courses/${courseId}`} className="text-primary hover:underline font-bold">← Return to Course</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <Link href={`/courses/${courseId}`} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors duration-200 transition-colors uppercase tracking-widest flex items-center gap-2 mb-2">
                            ← Exit Exam
                        </Link>
                        <h1 className="text-3xl font-extrabold text-foreground">{exam.title}</h1>
                        <p className="text-muted-foreground mt-1">Course Certification Assessment</p>
                    </div>
                    <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-100 flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-400">Target Score</span>
                            <span className="font-bold">{exam.passing_score}% or higher</span>
                        </div>
                    </div>
                </header>

                <main>
                    <AssessmentViewer
                        assessmentId={examId}
                        onComplete={() => { /* results shown inline by AssessmentViewer */ }}
                    />
                </main>

                <footer className="mt-12 text-center text-muted-foreground text-sm">
                    <p>Completing this exam with a passing score will award you a completion certificate.</p>
                </footer>
            </div>
        </div>
    );
}
