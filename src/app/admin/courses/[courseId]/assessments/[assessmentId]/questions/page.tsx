'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { getAssessment } from '@/lib/api';
import { QuestionsManager } from '@/components/admin/QuestionsManager';

export default function CourseAssessmentQuestionsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const assessmentId = params.assessmentId as string;
    const courseId = params.courseId as string;

    const [assessment, setAssessment] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (!['super_admin', 'course_provider', 'org_admin'].includes(user?.role || '')) router.push('/dashboard');
            else if (assessmentId) {
                getAssessment(assessmentId).then(({ data }) => {
                    setAssessment(data);
                    setIsFetching(false);
                });
            }
        }
    }, [isAuthenticated, isLoading, user, router, assessmentId]);

    if (isLoading || isFetching) return <div className="flex justify-center items-center min-h-[30vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <button onClick={() => router.back()} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest mb-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Assessments
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{assessment?.title || 'Assessment Questions'}</h1>
                <p className="text-gray-500 mt-1">
                    {assessment?.passing_score}% pass score · {(assessment?.time_limit_minutes ?? 0) > 0 ? `${assessment?.time_limit_minutes} min` : 'No time limit'}
                </p>
            </div>
            <QuestionsManager assessmentId={assessmentId} />
        </div>
    );
}
